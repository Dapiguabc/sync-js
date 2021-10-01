import sqlite3, { Database } from "better-sqlite3";

export default class SqlClient {
    // Database connection
    readonly conn: Database;

    constructor(db: Database) {
        this.conn = db
    }
    private static openDb(fileName: string): Database {
        return new sqlite3(fileName);
    }

    /**
     * createSqlClient: create new SqlClient
     */
    public static createSqlClient(fileName: string): SqlClient {
        const conn = SqlClient.openDb(fileName);
        const client = new SqlClient(conn);
        return client;
    }

    public init(): void {
        this.conn.exec(
            `CREATE TABLE IF NOT EXISTS job_config (
                name          TEXT NOT NULL PRIMARY KEY,
                canisterId    TEXT NOT NULL,
                type          TEXT NOT NULL,
                db            TEXT NOT NULL,
                cron          TEXT NOT NULL,
                desc          TEXT,
                status        INTEGER NOT NULL
            )`
        );
    }

    public exec(sqlstr: string): void {
        this.conn.exec(sqlstr);
    }

    public run(sqlstr: string): [boolean, string | null] {
        try{
            const stmt = this.conn.prepare(sqlstr);
            stmt.run();
            return [true, null];
        } catch(err) {
            return [false, err];
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public all<T = any>(sqlstr: string): T[] {
        const stmt = this.conn.prepare(sqlstr);
        const result = stmt.all() as T[];
        return result;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public get<T = any>(sqlstr: string): T {
        const stmt = this.conn.prepare(sqlstr);
        const result = stmt.get() as T;
        return result;
    }
}
