import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import pg from "pg"

const { Client } = pg
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error("DATABASE_URL nije podešen")

const migrationsDirectory = path.resolve(process.cwd(), "scripts")
const lockId = 18018018

async function connectWithRetry() {
  let lastError
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const client = new Client({
      connectionString: databaseUrl,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : false,
    })
    try {
      await client.connect()
      return client
    } catch (error) {
      lastError = error
      await client.end().catch(() => undefined)
      console.log(`[GARD018] Baza još nije spremna (${attempt}/30), novi pokušaj za 2s...`)
      await new Promise((resolve) => setTimeout(resolve, 2_000))
    }
  }
  throw lastError
}

const client = await connectWithRetry()
try {
  await client.query("SELECT pg_advisory_lock($1)", [lockId])
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const files = (await readdir(migrationsDirectory)).filter((file) => /^\d{3}-.+\.sql$/.test(file)).sort()
  let applied = new Set((await client.query("SELECT filename FROM schema_migrations")).rows.map((row) => row.filename))

  // Imported production/local backups already contain the full legacy schema.
  // Baseline those migrations once instead of replaying old seed statements over
  // live member data. A fresh empty database still runs every migration normally.
  if (applied.size === 0) {
    const existingSchema = await client.query(`
      SELECT
        to_regclass('public.members') IS NOT NULL AS has_members,
        to_regclass('public.users') IS NOT NULL AS has_users,
        to_regclass('public.weekly_training_schedule') IS NOT NULL AS has_schedule,
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email_verified_at'
        ) AS has_email_verification
    `)
    const schema = existingSchema.rows[0]
    if (schema.has_members && schema.has_users && schema.has_schedule && schema.has_email_verification) {
      const legacyFiles = files.filter((filename) => Number(filename.slice(0, 3)) <= 16)
      for (const filename of legacyFiles) {
        await client.query("INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING", [filename])
      }
      console.log("[GARD018] Postojeća kompletna šema je bezbedno označena kao baseline 001-016")
      applied = new Set((await client.query("SELECT filename FROM schema_migrations")).rows.map((row) => row.filename))
    }
  }

  for (const filename of files) {
    if (applied.has(filename)) continue
    const migration = await readFile(path.join(migrationsDirectory, filename), "utf8")
    console.log(`[GARD018] Pokrećem migraciju ${filename}`)
    await client.query("BEGIN")
    try {
      await client.query(migration)
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [filename])
      await client.query("COMMIT")
    } catch (error) {
      await client.query("ROLLBACK")
      throw new Error(`Migracija ${filename} nije uspela`, { cause: error })
    }
  }

  console.log("[GARD018] Sve migracije su primenjene")
} finally {
  await client.query("SELECT pg_advisory_unlock($1)", [lockId]).catch(() => undefined)
  await client.end()
}
