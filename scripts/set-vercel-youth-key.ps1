# Vercel Production/Preview에 YOUTH_CENTER_API_KEY 등록 (.env.local 값 사용)
# 사전: npx vercel link --yes
# 사용: powershell -ExecutionPolicy Bypass -File scripts/set-vercel-youth-key.ps1

$line = Get-Content .env.local | Where-Object { $_ -match '^\s*YOUTH_CENTER_API_KEY=' } | Select-Object -First 1
if (-not $line) {
  Write-Error 'YOUTH_CENTER_API_KEY가 .env.local에 없습니다.'
  exit 1
}
$value = $line -replace '^\s*YOUTH_CENTER_API_KEY=', '' -replace '^["'']|["'']$', ''
if (-not $value) {
  Write-Error 'YOUTH_CENTER_API_KEY 값이 비어 있습니다.'
  exit 1
}

Write-Host 'Vercel에 YOUTH_CENTER_API_KEY 등록 중 (production, preview, development)...'
$value | npx vercel@latest env add YOUTH_CENTER_API_KEY production
$value | npx vercel@latest env add YOUTH_CENTER_API_KEY preview
$value | npx vercel@latest env add YOUTH_CENTER_API_KEY development
Write-Host '완료. Vercel 대시보드에서 확인 후 Redeploy 하세요.'
