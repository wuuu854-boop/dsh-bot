# DSH Bot foreign-AI firewall containment.
#
# Creates per-executable Windows Firewall rules so a native foreign-AI app can
# only reach loopback (the local Clash proxy port) and cannot connect directly
# to the Internet. A self-test with a throw-away copy of curl must pass before
# any app rule is installed.
#
# This script MUST run elevated. It is intentionally conservative: if a target
# has no native .exe (PWA / browser-hosted), it is skipped and reported.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File contain_foreign_ai.ps1 -Action Install
#   ... -Action Status
#   ... -Action Remove

param(
    [ValidateSet('Install', 'Remove', 'Status', 'SelfTest', 'Discover')]
    [string]$Action = 'Install'
)

$ErrorActionPreference = 'Stop'
$Group = 'DSH Bot Foreign AI Containment'
$TestGroup = 'DSH Bot Firewall SelfTest'
$MarkerDir = Join-Path $env:ProgramData 'DSHBot'
$MarkerPath = Join-Path $MarkerDir 'foreign-ai-containment.json'
$LoopbackPort = 7890
$Hints = @('chatgpt', 'codex', 'claude', 'gemini', 'grok')
$SkipNames = @(
    'copilot', 'msedge', 'chrome', 'firefox', 'explorer', 'cmd',
    'powershell', 'pwsh', 'python', 'pythonw', 'java', 'node',
    'uninstall', 'updater', 'update', 'crashpad', 'werfault'
)

function Test-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-GroupRuleCount {
    $rules = @(Get-NetFirewallRule -Group $Group -ErrorAction SilentlyContinue)
    return $rules.Count
}

function Remove-RulesByGroup([string]$group) {
    Get-NetFirewallRule -Group $group -ErrorAction SilentlyContinue | Remove-NetFirewallRule -ErrorAction SilentlyContinue
}

function Add-ContainmentRules {
    param(
        [Parameter(Mandatory = $true)][string]$Exe,
        [Parameter(Mandatory = $true)][string]$GroupName,
        [Parameter(Mandatory = $true)][string]$Tag
    )

    $v4Ranges = @('1.0.0.0-126.255.255.255', '128.0.0.0-255.255.255.255')
    New-NetFirewallRule -DisplayName "$Tag - Block Internet IPv4" -Group $GroupName `
        -Direction Outbound -Action Block -Program $Exe -RemoteAddress $v4Ranges `
        -Profile Any -Enabled True | Out-Null

    # Block global IPv6 (the proxy is reached over 127.0.0.1:7890 / IPv4).
    New-NetFirewallRule -DisplayName "$Tag - Block Internet IPv6" -Group $GroupName `
        -Direction Outbound -Action Block -Program $Exe -RemoteAddress '2000::/3' `
        -Profile Any -Enabled True -ErrorAction Stop | Out-Null

    # Allow the local Clash HTTP proxy only. Loopback is outside the IPv4
    # Internet ranges above, so this Allow rule is not overridden by the Block.
    New-NetFirewallRule -DisplayName "$Tag - Allow Clash loopback" -Group $GroupName `
        -Direction Outbound -Action Allow -Program $Exe -Protocol TCP `
        -RemoteAddress '127.0.0.1' -RemotePort $LoopbackPort `
        -Profile Any -Enabled True | Out-Null
}

function Invoke-SelfTest {
    if (-not (Test-Admin)) {
        throw 'Self-test requires administrator rights.'
    }
    $testDir = Join-Path $env:TEMP ('dsh-fw-selftest-' + [guid]::NewGuid().ToString('N'))
    $testCurl = Join-Path $testDir 'curl.exe'
    New-Item -ItemType Directory -Path $testDir -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $env:SystemRoot 'System32\curl.exe') -Destination $testCurl -Force
    Remove-RulesByGroup $TestGroup
    try {
        Add-ContainmentRules -Exe $testCurl -GroupName $TestGroup -Tag 'DSH Bot SelfTest'

        $env:HTTP_PROXY = ''
        $env:HTTPS_PROXY = ''
        $env:ALL_PROXY = ''
        $env:NO_PROXY = ''

        $directOutput = & $testCurl --noproxy '*' -4 --max-time 6 -s -o NUL -w '%{http_code}' 'https://api.ipify.org?format=json' 2>$null
        $directExit = $LASTEXITCODE
        $proxyOutput = & $testCurl --noproxy '' --max-time 10 -s -x "http://127.0.0.1:$LoopbackPort" 'https://api.ipify.org?format=json' 2>$null
        $proxyExit = $LASTEXITCODE

        if ($directExit -eq 0) {
            throw "Self-test failed: direct curl was not blocked (exit $directExit, status $directOutput)."
        }
        if ($proxyExit -ne 0 -or -not $proxyOutput) {
            throw "Self-test failed: proxied curl failed (exit $proxyExit)."
        }
        return @{
            ok = $true
            directExit = $directExit
            proxyExit = $proxyExit
            proxyPreview = ([string]$proxyOutput).Substring(0, [Math]::Min(120, ([string]$proxyOutput).Length))
        }
    }
    finally {
        Remove-RulesByGroup $TestGroup
        Remove-Item -LiteralPath $testDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Get-AppPaths {
    $found = @{}

    function Add-Path([string]$path, [string]$name) {
        if ([string]::IsNullOrWhiteSpace($path)) { return }
        if ($path -notmatch '\.exe$') { return }
        if (-not (Test-Path -LiteralPath $path)) { return }
        $leaf = [IO.Path]::GetFileNameWithoutExtension($path).ToLowerInvariant()
        if ($SkipNames -contains $leaf) { return }
        if ($path -match '\\WindowsApps\\Microsoft\\.MicrosoftOfficeHub') { return }
        $key = $path.ToLowerInvariant()
        if (-not $found.ContainsKey($key)) {
            $found[$key] = @{ path = $path; name = $name }
        }
    }

    # Running native processes first; these paths are the most reliable.
    Get-Process -ErrorAction SilentlyContinue | ForEach-Object {
        $name = ($_.ProcessName + '').ToLowerInvariant()
        $matches = $false
        foreach ($hint in $Hints) {
            if ($name.Contains($hint)) { $matches = $true; break }
        }
        if ($matches -and $_.Path) {
            Add-Path $_.Path $_.ProcessName
        }
    }

    # AppX packages: include native exes inside the package install location.
    $packages = Get-AppxPackage -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -match 'OpenAI|ChatGPT|Codex|Claude|Gemini|Grok'
    }
    foreach ($package in $packages) {
        if (-not $package.InstallLocation) { continue }
        if ($package.InstallLocation -match 'Microsoft\\.MicrosoftOfficeHub') { continue }
        Get-ChildItem -LiteralPath $package.InstallLocation -Filter *.exe -Recurse -ErrorAction SilentlyContinue |
            ForEach-Object { Add-Path $_.FullName $_.BaseName }
    }

    # Start Menu / Desktop shortcuts can point at a launcher exe.
    $roots = @(
        (Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs'),
        (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'),
        (Join-Path $env:USERPROFILE 'Desktop'),
        (Join-Path $env:PUBLIC 'Desktop')
    )
    $shell = New-Object -ComObject WScript.Shell
    foreach ($root in $roots) {
        if (-not (Test-Path -LiteralPath $root)) { continue }
        Get-ChildItem -LiteralPath $root -Filter *.lnk -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
            $stem = $_.BaseName.ToLowerInvariant()
            $matches = $false
            foreach ($hint in $Hints) {
                if ($stem.Contains($hint)) { $matches = $true; break }
            }
            if (-not $matches) { return }
            try {
                $target = $shell.CreateShortcut($_.FullName).TargetPath
                if ($target -and $target -match '\.exe$') {
                    Add-Path $target $_.BaseName
                }
            } catch {
                # Ignore broken shortcuts.
            }
        }
    }

    return @($found.Values | Sort-Object { $_.name }, { $_.path })
}

function Write-Marker($apps, $ruleCount, $selfTest) {
    New-Item -ItemType Directory -Path $MarkerDir -Force | Out-Null
    $payload = @{
        installedAt = (Get-Date).ToString('o')
        group = $Group
        ruleCount = $ruleCount
        selfTest = $selfTest
        apps = @($apps | ForEach-Object { @{ name = $_.name; path = $_.path } })
    }
    $payload | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $MarkerPath -Encoding UTF8
}

function Install-Containment {
    $selfTest = Invoke-SelfTest
    Remove-RulesByGroup $Group
    $apps = @(Get-AppPaths)
    if ($apps.Count -eq 0) {
        throw 'No native foreign-AI executable found. PWA/browser-hosted apps cannot be contained per-process; use a dedicated browser profile or TUN for those.'
    }

    $index = 0
    foreach ($app in $apps) {
        $index += 1
        $tag = "DSH Bot - $($app.name) - $index"
        Add-ContainmentRules -Exe $app.path -GroupName $Group -Tag $tag
    }
    Start-Sleep -Milliseconds 400
    $ruleCount = Get-GroupRuleCount
    if ($ruleCount -lt ($apps.Count * 3)) {
        throw "Only $ruleCount firewall rules were created for $($apps.Count) apps; expected at least $($apps.Count * 3)."
    }
    Write-Marker $apps $ruleCount $selfTest
    return @{
        ok = $true
        installedAt = (Get-Date).ToString('o')
        apps = $apps
        ruleCount = $ruleCount
        selfTest = $selfTest
        marker = $MarkerPath
    }
}

function Remove-Containment {
    Remove-RulesByGroup $Group
    Remove-RulesByGroup $TestGroup
    if (Test-Path -LiteralPath $MarkerPath) {
        Remove-Item -LiteralPath $MarkerPath -Force
    }
    return @{ ok = $true; removed = $true }
}

function Get-Status {
    $marker = $null
    if (Test-Path -LiteralPath $MarkerPath) {
        try { $marker = Get-Content -LiteralPath $MarkerPath -Raw | ConvertFrom-Json } catch { $marker = $null }
    }
    $count = Get-GroupRuleCount
    $ruleCount = 0
    if ($marker -and $marker.ruleCount) { $ruleCount = [int]$marker.ruleCount }
    return @{
        ok = $true
        installed = [bool]($marker -and $count -gt 0 -and $count -ge $ruleCount)
        marker = $MarkerPath
        markerPresent = [bool]$marker
        ruleCount = $count
        expectedRuleCount = $ruleCount
        apps = if ($marker) { @($marker.apps) } else { @() }
        selfTest = if ($marker) { $marker.selfTest } else { $null }
    }
}

try {
    if ($Action -eq 'Status') {
        Get-Status | ConvertTo-Json -Depth 6
        exit 0
    }
    if ($Action -eq 'Discover') {
        @(Get-AppPaths) | ConvertTo-Json -Depth 4
        exit 0
    }
    if (-not (Test-Admin)) {
        Write-Error 'Administrator rights are required. Right-click the wrapper and choose "Run as administrator".'
        exit 2
    }
    switch ($Action) {
        'SelfTest' { Invoke-SelfTest | ConvertTo-Json -Depth 5; break }
        'Remove' { Remove-Containment | ConvertTo-Json -Depth 5; break }
        'Install' { Install-Containment | ConvertTo-Json -Depth 6; break }
    }
    exit 0
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
