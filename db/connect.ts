import { Kysely, SqliteDialect } from 'kysely';
import { DB } from 'kysely-codegen';
import SQLite from 'better-sqlite3';

const dialect = new SqliteDialect({
    database: new SQLite('db/main.db')
})

export const db = new Kysely<DB>({ dialect });
