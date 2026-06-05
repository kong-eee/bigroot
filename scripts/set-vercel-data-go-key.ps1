# Vercel에 DATA_GO_KR_SERVICE_KEY 등록 (.env.local 값 사용)
# 사전: npx vercel link --yes
# 사용: powershell -ExecutionPolicy Bypass -File scripts/set-vercel-data-go-key.ps1

$line = Get-Content .env.local | Where-Object { $_ -match '^\s*DATA_GO_KR_SERVICE_KEY=' } | Select-Object -First 1
if (-not $line) {
  Write-Error 'DATA_GO_KR_SERVICE_KEY가 .env.local에 없습니다.'
  exit 1
}
$value = $line -replace '^\s*DATA_GO_KR_SERVICE_KEY=', '' -replace '^["'']|["'']$', ''
if (-not $value) {
  Write-Error 'DATA_GO_KR_SERVICE_KEY 값이 비어 있습니다. 공공데이터포털 인증키를 붙여넣으세요.'
  exit 1
}

Write-Host 'Vercel에 DATA_GO_KR_SERVICE_KEY 등록 중 (production)...'
$value | npx vercel@latest env add DATA_GO_KR_SERVICE_KEY production
Write-Host '완료. vercel --prod 로 재배포하세요.'
