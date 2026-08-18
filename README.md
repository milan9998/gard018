# GARD 018

Jedna full-stack Next.js aplikacija za sajt i upravljanje klubom. Frontend i API ostaju zajedno; PostgreSQL je poseban Docker servis.

## Funkcije

- prijava, registracija, verifikacija emaila i reset lozinke
- admin panel, članovi, članarine i zaštićeni trenerski admin
- individualni termini i rezervacije samo za označene članove
- QR kod redovne članarine i admin skener
- nedeljni raspored treninga
- automatska Resend obaveštenja bez duplog slanja
- lokalno čuvanje profilnih slika u trajnom Docker volume-u

## Lokalno pokretanje

Potrebni su Node.js 22+, pnpm i lokalni PostgreSQL.

```bash
pnpm install
pnpm dev
```

Lokalni `.env.local` nije deo Git repozitorijuma.

## Produkciona arhitektura

- `caddy`: HTTPS za `app.gard018.com` i reverse proxy
- `app`: Next.js standalone image
- `postgres`: PostgreSQL 16 sa trajnim volume-om
- `scheduler`: dnevna provera članarina posle 08:00 Europe/Belgrade

Javno su otvoreni samo portovi 80 i 443. PostgreSQL i Next.js port 3000 ostaju u Docker mreži.

## Prvo postavljanje servera

1. Instalirati Docker Engine i Docker Compose plugin.
2. Kopirati repozitorijum u direktorijum, na primer `/opt/gard018`.
3. Kopirati serverski env kao `/opt/gard018/.env`.
4. Rotirati Resend ključ i upisati novi `RESEND_API_KEY`.
5. Kopirati `gard018-production.dump` bezbednim kanalom u isti direktorijum. Backup ne ide na GitHub.
6. Prijaviti server u GHCR za privatni image:

```bash
echo "GHCR_READ_TOKEN" | docker login ghcr.io -u milan9998 --password-stdin
```

7. Pokrenuti prvo postavljanje:

```bash
chmod +x deploy/*.sh
./deploy/first-deploy.sh gard018-production.dump
```

Skripta odbija restore ako ciljna baza već ima tabele.

## Provere posle podizanja

```bash
docker compose ps
docker compose logs --tail=200 app
docker compose logs --tail=100 caddy
```

Otvoriti:

- `https://app.gard018.com/api/health`
- `https://app.gard018.com/prijava`
- `https://app.gard018.com/registracija`

Zatim proveriti registraciju i verifikacioni email, login, admin stranice, upload slike, QR kameru, članarinu i individualnu rezervaciju.

## GitHub CI/CD

Workflow `.github/workflows/production.yml` radi typecheck i build, zatim za `main` pravi `ghcr.io/milan9998/gard018:latest`.

Automatski deployment se uključuje tek kada se u GitHub Actions podese:

- Repository variable: `DEPLOY_ENABLED=true`
- Secrets: `SERVER_HOST`, `SERVER_PORT`, `SERVER_USER`, `SERVER_SSH_KEY`, `SERVER_KNOWN_HOSTS`, `DEPLOY_PATH`

Server mora prethodno biti prijavljen u GHCR i u `DEPLOY_PATH` mora imati `.env`, `docker-compose.yml`, `Caddyfile` i `deploy/update.sh`.

## Važna bezbednosna pravila

- nikada ne commitovati `.env`, database dump ili `uploads`
- ne izlagati PostgreSQL port javno
- koristiti samo HTTPS
- redovno praviti backup `postgres_data` i `uploads_data`
- rotirati svaki ključ koji je ranije deljen van servera
