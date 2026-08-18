import { Pool, types } from "pg"

type SqlClient = ((strings: TemplateStringsArray, ...values: unknown[]) => Promise<any[]>) & {
  query: (query: string, params?: unknown[]) => Promise<any[]>
}

// Keep PostgreSQL date/time values as strings. This matches the previous Neon
// behaviour and prevents the Node process timezone from shifting club dates.
types.setTypeParser(1082, (value) => value)
types.setTypeParser(1114, (value) => value)
types.setTypeParser(1184, (value) => value)

function getConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  if (process.env.LOCAL_DATABASE === "true") {
    return "postgresql://gard018@127.0.0.1:55432/gard018"
  }
  throw new Error("DATABASE_URL nije podešen")
}

const globalForDb = globalThis as unknown as { gard018Pool?: Pool }
let localPool: Pool | undefined

function getPool() {
  const existingPool = globalForDb.gard018Pool || localPool
  if (existingPool) return existingPool

  const pool = new Pool({
    connectionString: getConnectionString(),
    max: Number(process.env.DB_POOL_MAX || 10),
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : false,
  })

  pool.on("error", (error) => {
    console.error("[GARD018] Neočekivana PostgreSQL pool greška:", error)
  })

  if (process.env.NODE_ENV !== "production") globalForDb.gard018Pool = pool
  else localPool = pool

  return pool
}

function buildParameterizedQuery(strings: TemplateStringsArray, values: unknown[]) {
  let text = strings[0]
  for (let index = 0; index < values.length; index += 1) {
    text += `$${index + 1}${strings[index + 1]}`
  }
  return { text, values }
}

const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
  const query = buildParameterizedQuery(strings, values)
  const result = await getPool().query(query.text, query.values)
  return result.rows
}) as SqlClient

sql.query = async (query: string, params: unknown[] = []) => {
  const result = await getPool().query(query, params)
  return result.rows
}

export { sql }
