# Vercel Production에 Solapi·골든타임 env 등록 (.env.local 값 사용)
# 사용: powershell -ExecutionPolicy Bypass -File scripts/set-vercel-solapi.ps1

$vars = @(
  'SOLAPI_API_KEY',
  'SOLAPI_API_SECRET',
  'SOLAPI_SENDER_PHONE',
  'SOLAPI_KAKAO_PF_ID',
  'SOLAPI_KAKAO_TEMPLATE_SLOT_1',
  'SOLAPI_KAKAO_TEMPLATE_SLOT_2',
  'SOLAPI_KAKAO_TEMPLATE_SLOT_3',
  'SOLAPI_KAKAO_SEND_ENABLED',
  'CRON_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY'
)

foreach ($name in $vars) {
  $line = Get-Content .env.local | Where-Object { $_ -match "^\s*$name=" } | Select-Object -First 1
  if (-not $line) {
    Write-Host "skip $name (not in .env.local)"
    continue
  }
  $value = $line -replace "^\s*$name=", '' -replace '^["'']|["'']$', ''
  if (-not $value) {
    Write-Host "skip $name (empty)"
    continue
  }
  Write-Host "add $name ..."
  npx vercel@latest env add $name production --value $value --yes --sensitive 2>&1 | Out-Host
}

Write-Host '완료. npx vercel --prod 로 재배포하세요.'
