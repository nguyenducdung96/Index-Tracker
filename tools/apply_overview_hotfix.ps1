$ErrorActionPreference = "Stop"
$target = "apps/web/src/components/industry/PortIndustryTab.tsx"
if (!(Test-Path $target)) { throw "Không tìm thấy $target. Hãy chạy script ở root repo." }
$src = Get-Content $target -Raw
$backup = "$target.before-overview-hotfix.bak"
Copy-Item $target $backup -Force

$importLine = 'import { PortAuthorityOverview } from "./PortAuthorityOverview";'
if ($src -notmatch [regex]::Escape($importLine)) {
  $src = $importLine + "`r`n" + $src
}

$start = $src.IndexOf("function Overview(")
$end = $src.IndexOf("function RegionsDashboard", $start)
if ($start -lt 0 -or $end -lt 0) {
  throw "Không nhận diện được block Overview/RegionsDashboard. File gốc đã được giữ nguyên ở $backup"
}

$replacement = @'
function Overview(props:any){
  return <PortAuthorityOverview data={props.data} onCompany={props.onCompany} onRegions={props.onRegions}/>;
}

'@
$src = $src.Substring(0,$start) + $replacement + $src.Substring($end)
Set-Content $target $src -Encoding UTF8
Write-Host "OK: Chỉ thay block Overview; các tab Khu vực/Doanh nghiệp/Terminal/Nguồn dữ liệu được giữ nguyên."
Write-Host "Backup: $backup"
