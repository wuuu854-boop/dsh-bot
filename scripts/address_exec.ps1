param([Parameter(Mandatory=$true)][string]$File,[Parameter(Mandatory=$true)][int]$Handle)
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms
$root=[System.Windows.Automation.AutomationElement]::FromHandle([IntPtr]$Handle)
$cond=[System.Windows.Automation.Condition]::TrueCondition
$all=$root.FindAll([System.Windows.Automation.TreeScope]::Descendants,$cond)
$addr=$null
foreach($e in $all){
  if($addr -ne $null){break}
  if($e.Current.ControlType.ProgrammaticName -ne 'ControlType.Edit'){continue}
  $id=$e.Current.AutomationId
  $nm=$e.Current.Name
  if($id -eq 'view_1017' -or $nm -match 'Address and search|地址和搜索'){ $addr=$e }
}
if($addr -eq $null){ Write-Output '{"ok":false,"error":"address bar not found"}'; exit 1 }
$text=[IO.File]::ReadAllText($File,[Text.Encoding]::UTF8)
$vp=$addr.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
$vp.SetValue($text)
$addr.SetFocus()
Start-Sleep -Milliseconds 80
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
Start-Sleep -Milliseconds 150
Write-Output (@{ok=$true;chars=$text.Length} | ConvertTo-Json -Compress)
