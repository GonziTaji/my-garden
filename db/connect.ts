import { CamelCasePlugin, Kysely, SqliteDialect } from 'kysely';
import { DB } from 'kysely-codegen';
import SQLite from 'better-sqlite3';

const database = new SQLite('db/main.db');
database.pragma('foreign_keys = ON');

const dialect = new SqliteDialect({ database });

export const db = new Kysely<DB>({
    dialect,
    plugins: [new CamelCasePlugin()],
});
