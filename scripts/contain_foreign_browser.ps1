param(
    [ValidateSet('Install', 'Status', 'Remove')]
    [string]$Action = 'Install',
    [string]$BrowserPath = (Join-Path $PSScriptRoot '..\browser\firefox\firefox.exe')
)

$ErrorActionPreference = 'Stop'
$Group = 'DSH Bot Foreign Browser Containment'
$TestGroup = 'DSH Bot Foreign Browser SelfTest'
$MarkerDir = Join-Path $env:ProgramData 'DSHBot'
$MarkerPath = Join-Path $MarkerDir 'foreign-browser-containment.json'
$LoopbackPort = 7890

function Test-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Write-Marker($value) {
    New-Item -ItemType Directory -Force -Path $MarkerDir | Out-Null
    $value | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $MarkerPath -Encoding UTF8
}

function Get-GroupRules([string]$group) {
    return @(Get-NetFirewallRule -Group $group -ErrorAction SilentlyContinue)
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
        -Profile Any -Enabled True -ErrorAction Stop | Out-Null
    New-NetFirewallRule -DisplayName "$Tag - Block Internet IPv6" -Group $GroupName `
        -Direction Outbound -Action Block -Program $Exe -RemoteAddress '2000::/3' `
        -Profile Any -Enabled True -ErrorAction Stop | Out-Null
    New-NetFirewallRule -DisplayName "$Tag - Allow Clash loopback" -Group $GroupName `
        -Direction Outbound -Action Allow -Program $Exe -Protocol TCP `
        -RemoteAddress '127.0.0.1' -RemotePort $LoopbackPort `
        -Profile Any -Enabled True -ErrorAction Stop | Out-Null
}

function Get-BrowserExes {
    $dir = Split-Path -Parent $BrowserPath
    $exes = @(Get-ChildItem -LiteralPath $dir -Filter '*.exe' -File -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName })
    if ($exes.Count -eq 0) { $exes = @($BrowserPath) }
    return $exes
}

function Invoke-SelfTest([string[]]$Exes) {
    $selfDir = Join-Path $env:ProgramData 'DSHBot\browser-selftest'
    New-Item -ItemType Directory -Force -Path $selfDir | Out-Null
    $sourceCurl = Join-Path $env:SystemRoot 'System32\curl.exe'
    if (-not (Test-Path -LiteralPath $sourceCurl)) {
        return @{ ok = $false; error = 'curl.exe not found' }
    }
    $testCurl = Join-Path $selfDir 'curl.exe'
    Copy-Item -LiteralPath $sourceCurl -Destination $testCurl -Force
    Remove-RulesByGroup $TestGroup
    try {
        Add-ContainmentRules -Exe $testCurl -GroupName $TestGroup -Tag 'DSH Browser SelfTest'
        $direct = Start-Process -FilePath $testCurl -ArgumentList @('--max-time', '6', '-sS', '-o', 'NUL', 'https://example.com/') -Wait -PassThru -WindowStyle Hidden
        $proxied = Start-Process -FilePath $testCurl -ArgumentList @('--max-time', '10', '-sS', '-o', 'NUL', '-x', 'socks5h://127.0.0.1:7890', 'https://example.com/') -Wait -PassThru -WindowStyle Hidden
        return @{
            ok = ($direct.ExitCode -ne 0 -and $proxied.ExitCode -eq 0)
            directExit = $direct.ExitCode
            proxyExit = $proxied.ExitCode
        }
    } finally {
        Remove-RulesByGroup $TestGroup
        Remove-Item -LiteralPath $selfDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Get-Status {
    $exes = Get-BrowserExes
    $rules = Get-GroupRules $Group
    $expected = 3 * $exes.Count
    $ready = (Test-Path -LiteralPath $BrowserPath) -and ($rules.Count -ge $expected)
    return @{
        ok = $ready
        installed = $ready
        group = $Group
        ruleCount = $rules.Count
        expectedRules = $expected
        browser = $BrowserPath
        exes = $exes
        marker = $MarkerPath
        action = 'Status'
    }
}

if ($Action -eq 'Status') {
    Get-Status | ConvertTo-Json -Depth 6
    exit 0
}

if (-not (Test-Admin)) {
    $error = '需要管理员权限安装浏览器防火墙规则'
    Write-Marker @{ ok = $false; error = $error; at = (Get-Date).ToString('o') }
    @{ ok = $false; error = $error; action = $Action } | ConvertTo-Json
    exit 1
}

if ($Action -eq 'Remove') {
    Remove-RulesByGroup $Group
    Remove-RulesByGroup $TestGroup
    Remove-Item -LiteralPath $MarkerPath -Force -ErrorAction SilentlyContinue
    @{ ok = $true; removed = $true; group = $Group } | ConvertTo-Json
    exit 0
}

if (-not (Test-Path -LiteralPath $BrowserPath)) {
    $error = "Firefox not found: $BrowserPath"
    Write-Marker @{ ok = $false; error = $error; at = (Get-Date).ToString('o') }
    @{ ok = $false; error = $error; action = 'Install' } | ConvertTo-Json
    exit 1
}

Remove-RulesByGroup $Group
$exes = Get-BrowserExes
foreach ($exe in $exes) {
    Add-ContainmentRules -Exe $exe -GroupName $Group -Tag ("DSH Browser - " + (Split-Path -Leaf $exe))
}

$test = Invoke-SelfTest $exes
$rules = Get-GroupRules $Group
$result = @{
    ok = [bool]$test.ok
    installed = [bool]$test.ok
    group = $Group
    ruleCount = $rules.Count
    expectedRules = 3 * $exes.Count
    browser = $BrowserPath
    exes = $exes
    marker = $MarkerPath
    selfTest = $test
    at = (Get-Date).ToString('o')
}

if (-not $test.ok) {
    Remove-RulesByGroup $Group
    $result.ok = $false
    $result.installed = $false
    $result.error = 'self-test failed: direct connection not blocked, or loopback proxy failed'
    Write-Marker $result
    $result | ConvertTo-Json -Depth 6
    exit 1
}

Write-Marker $result
$result | ConvertTo-Json -Depth 6
exit 0
