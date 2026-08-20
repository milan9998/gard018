$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

if (Get-Command git -ErrorAction SilentlyContinue) {
  $gitChanges = git status --porcelain
  if ($gitChanges) {
    Write-Host "Lokalne Git izmene postoje; preskačem git pull da ih ne bih pregazio." -ForegroundColor Yellow
  } else {
    Write-Host "Proveravam najnoviju verziju sa origin/main..." -ForegroundColor Cyan
    git pull --ff-only origin main
    if ($LASTEXITCODE -ne 0) {
      throw "Git nije uspeo da preuzme origin/main. Proveri vezu ili GitHub pristup."
    }
  }
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker CLI nije pronađen. Pokreni Docker Desktop i sačekaj da piše Engine running."
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Docker Desktop nije pokrenut ili Docker Engine još nije spreman."
}

$desktopEnv = "C:\Users\proni\Desktop\GARD018-SERVER-ENV.txt"
$envPath = Join-Path $PSScriptRoot ".env"
$backupPath = "C:\Users\proni\Desktop\gard018-production.dump"

if (-not (Test-Path $envPath)) {
  if (-not (Test-Path $desktopEnv)) {
    throw "Nedostaje $desktopEnv"
  }
  Copy-Item -LiteralPath $desktopEnv -Destination $envPath
}

$envText = Get-Content -LiteralPath $envPath -Raw
$envText = [regex]::Replace($envText, "(?m)^APP_IMAGE=.*$", "APP_IMAGE=gard018-app:local")
# Keep the URL selected in .env so temporary Cloudflare links can be used for
# phone/email testing. Fall back to localhost only when the variable is absent.
if ($envText -notmatch "(?m)^NEXT_PUBLIC_BASE_URL=") {
  $envText = $envText.TrimEnd() + "`r`nNEXT_PUBLIC_BASE_URL=auto`r`n"
}
[System.IO.File]::WriteAllText($envPath, $envText)

if (-not (Test-Path $backupPath)) {
  throw "Nedostaje $backupPath"
}

$compose = @("-p", "gard018-local", "-f", "docker-compose.yml", "-f", "docker-compose.local.yml")

Write-Host "Pokrećem PostgreSQL..." -ForegroundColor Cyan
& docker compose @compose up -d postgres

Write-Host "Čekam da baza bude spremna..." -ForegroundColor Cyan
for ($i = 0; $i -lt 60; $i++) {
  & docker compose @compose exec -T postgres pg_isready -U gard018 -d gard018 *> $null
  if ($LASTEXITCODE -eq 0) { break }
  Start-Sleep -Seconds 2
}
if ($LASTEXITCODE -ne 0) { throw "PostgreSQL se nije pokrenuo." }

$membersTable = (& docker compose @compose exec -T postgres psql -U gard018 -d gard018 -Atc "SELECT to_regclass('public.members') IS NOT NULL").Trim()
$memberCount = if ($membersTable -eq "t") {
  (& docker compose @compose exec -T postgres psql -U gard018 -d gard018 -Atc "SELECT count(*) FROM public.members").Trim()
} else {
  "0"
}
if ($membersTable -ne "t" -or $memberCount -eq "0") {
  Write-Host "Ubacujem lokalni backup baze..." -ForegroundColor Cyan
  & docker compose @compose cp $backupPath postgres:/tmp/gard018-production.dump
  & docker compose @compose exec -T postgres pg_restore --clean --if-exists --no-owner --no-acl -U gard018 -d gard018 /tmp/gard018-production.dump
} else {
  Write-Host "Lokalna Docker baza već ima podatke; backup nije ponovo ubačen." -ForegroundColor Yellow
}

Write-Host "Gradim i pokrećem aplikaciju..." -ForegroundColor Cyan
& docker compose @compose build --no-cache app
if ($LASTEXITCODE -ne 0) { throw "Docker build aplikacije nije uspeo." }

& docker compose @compose up -d --force-recreate app scheduler
if ($LASTEXITCODE -ne 0) { throw "Docker kontejneri aplikacije nisu pokrenuti." }

$commit = if (Get-Command git -ErrorAction SilentlyContinue) { (git rev-parse --short HEAD).Trim() } else { "nepoznat" }
Write-Host ("Pokrenuta verzija: {0}" -f $commit) -ForegroundColor Green

Write-Host "Provera aplikacije..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
try {
  $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health"
  Write-Host ("Status: {0}, baza: {1}" -f $health.status, $health.database) -ForegroundColor Green
} catch {
  Write-Host "Aplikacija se još pokreće. Proveri http://localhost:3000/prijava za nekoliko sekundi." -ForegroundColor Yellow
}

Start-Process "http://localhost:3000/prijava"
Write-Host "Gotovo. Docker Desktop sada prikazuje gard018-local kontejnere." -ForegroundColor Green
