import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'fs'

export function createD1Mock(schemaPath: string, migrationPath?: string) {
  const db = new DatabaseSync(':memory:')
  
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;')
  
  // Load schema
  const schema = readFileSync(schemaPath, 'utf-8')
  db.exec(schema)
  
  if (migrationPath) {
    const migration = readFileSync(migrationPath, 'utf-8')
    db.exec(migration)
  }

  // Create D1 interface wrapper
  const d1 = {
    prepare: (query: string) => {
      // D1 uses ? or ?1 for bindings
      return {
        bind: (...params: any[]) => {
          return {
            first: async <T>() => {
              const stmt = db.prepare(query)
              try {
                const res = stmt.get(...params)
                return res as T
              } catch(e: any) {
                if (e.message.includes('FOREIGN KEY constraint failed')) {
                  throw new Error('D1_ERROR: FOREIGN KEY constraint failed')
                }
                if (e.message.includes('UNIQUE constraint failed')) {
                  throw new Error('D1_ERROR: UNIQUE constraint failed')
                }
                throw e
              }
            },
            all: async <T>() => {
              const stmt = db.prepare(query)
              const res = stmt.all(...params)
              return { results: res as T[] }
            },
            run: async () => {
              const stmt = db.prepare(query)
              try {
                const info = stmt.run(...params)
                return { success: true, meta: { changes: info.changes } }
              } catch (e: any) {
                if (e.message.includes('FOREIGN KEY constraint failed')) {
                  throw new Error('D1_ERROR: FOREIGN KEY constraint failed')
                }
                if (e.message.includes('UNIQUE constraint failed')) {
                  throw new Error('D1_ERROR: UNIQUE constraint failed')
                }
                throw e
              }
            }
          }
        },
        first: async <T>() => {
          const stmt = db.prepare(query)
          return stmt.get() as T
        },
        all: async <T>() => {
          const stmt = db.prepare(query)
          return { results: stmt.all() as T[] }
        },
        run: async () => {
          const stmt = db.prepare(query)
          const info = stmt.run()
          return { success: true, meta: { changes: info.changes } }
        }
      }
    },
    exec: async (query: string) => {
      db.exec(query)
    },
    batch: async (statements: any[]) => {
      // Mock D1 batch by running statements sequentially in memory
      const results = []
      for (const stmt of statements) {
        // Each stmt is a result of db.prepare().bind()
        // Which in our mock returns an object with run(), all(), first()
        results.push(await stmt.run())
      }
      return results
    }
  }

  return { d1, raw: db }
}
