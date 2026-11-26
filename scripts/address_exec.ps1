param([Parameter(Mandatory=$true)][string]$File,[Parameter(Mandatory=$true)][int]$Handle)
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms
$root=[System.Windows.Automation.AutomationElement]::FromHandle([IntPtr]$Handle)
if($root -eq $null){ Write-Output '{"ok":false,"error":"window not found"}'; exit 1 }
$top=$root.Current.BoundingRectangle.Top
$cond=[System.Windows.Automation.Condition]::TrueCondition
$all=$root.FindAll([System.Windows.Automation.TreeScope]::Descendants,$cond)
$candidates=New-Object System.Collections.ArrayList
foreach($e in $all){
  try{
    if($e.Current.ControlType.ProgrammaticName -ne 'ControlType.Edit'){continue}
    if(-not $e.Current.IsEnabled){continue}
    $r=$e.Current.BoundingRectangle
    if($r.Width -lt 220){continue}
    if($r.Top -lt ($top-8) -or $r.Top -gt ($top+230)){continue}
    $null=$candidates.Add([pscustomobject]@{el=$e;top=$r.Top;width=$r.Width;name=$e.Current.Name;id=$e.Current.AutomationId})
  }catch{}
}
$addr=$null
foreach($c in $candidates){ if($c.id -eq 'view_1017' -or $c.id -eq 'urlbar'){ $addr=$c.el; break } }
if($addr -eq $null){
  $best=$candidates | Sort-Object top,@{Expression='width';Descending=$true} | Select-Object -First 1
  if($best){ $addr=$best.el }
}
if($addr -eq $null){ Write-Output '{"ok":false,"error":"address bar not found"}'; exit 1 }
$text=[IO.File]::ReadAllText($File,[Text.Encoding]::UTF8)
$vp=$addr.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
$vp.SetValue($text)
$addr.SetFocus()
Start-Sleep -Milliseconds 80
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
Start-Sleep -Milliseconds 150
Write-Output (@{ok=$true;chars=$text.Length;name=$addr.Current.Name;id=$addr.Current.AutomationId} | ConvertTo-Json -Compress)
