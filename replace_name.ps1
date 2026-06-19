$root = 'c:\Users\HP\Downloads\we-are-going-home-main\we-are-going-home-main'
$files = @(
  'src\routes\admin.cms.tsx',
  'src\data\mock.ts',
  'src\context\AuthContext.tsx',
  'src\routes\admin.settings.tsx',
  'src\components\wag\Navbar.tsx',
  'src\components\wag\Footer.tsx',
  'src\routes\communities.tsx',
  'run_backend.py',
  'backend\api\emails.py',
  'src\routes\dashboard.venues.tsx',
  'src\routes\directory.tsx',
  'src\routes\events.tsx',
  'src\routes\index.tsx',
  'src\routes\jobs.tsx',
  'src\routes\login.tsx',
  'src\routes\matrimony.tsx',
  'src\routes\register.community.tsx',
  'src\routes\register.index.tsx',
  'src\routes\__root.tsx'
)
foreach ($f in $files) {
  $path = Join-Path $root $f
  if (Test-Path $path) {
    $content = Get-Content $path -Raw -Encoding UTF8
    $updated = $content -replace 'V R BHOI', 'WE ARE UNITED' -replace 'V R Bhoi', 'we Are United'
    Set-Content -Path $path -Value $updated -Encoding UTF8 -NoNewline
    Write-Host "Updated: $f"
  } else {
    Write-Host "Not found: $f"
  }
}
Write-Host "All done!"
