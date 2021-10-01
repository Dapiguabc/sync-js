import { Actor, HttpAgent } from "@dfinity/agent";
import IDL from "../did/index.js";
import SqlClient from "../sql.js";
import nodefetch  from "node-fetch";
import { Principal } from "@dfinity/principal";
import { TxRecord } from "../shim.js";
import { workerData } from "worker_threads";
import logger from "../log.js";

const log = logger.scope("token job scope");

// Due to the problem of data accuracy, some columns are saved in string.
interface HistoryRow {
    op: string,
    tx_to: string,
    fee: string,
    tx_from: Principal ,
    timestamp: number,
    caller: string,
    tx_index: number,
    amount: string
}
// Convert op object to string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleOP(op: {[x: string]: any;}): string {
    return Object.keys(op).join(",");
} 

(async () => {
    const sqlClient = SqlClient.createSqlClient(workerData.db);
    await sqlClient.exec(       
        `CREATE TABLE IF NOT EXISTS token_history (
            caller        TEXT NOT NULL,
            op            TEXT NOT NULL,
            tx_index      INTEGER PRIMARY KEY,
            tx_from       TEXT NOT NULL,
            tx_to         TEXT NOT NULL,
            amount        TEXT NOT NULL,
            fee           TEXT NOT NULL,
            timestamp     INTEGER NOT NULL,
            canisterId    TEXT NOT NULL
        )`
    );
    const ac = Actor.createActor(IDL.IDL_TOKEN, {
        agent: new HttpAgent({
            host: process.env.ICP_HOST || "https://ic0.app/",
            fetch: nodefetch as unknown as typeof fetch,
        }),
        canisterId: workerData.canisterId,
    });
    const size: BigInt = await ac.historySize() as BigInt;
    const row = sqlClient.get<HistoryRow>("select * from token_history order by  tx_index desc limit 1");
    const begin = row? BigInt(row.tx_index + 1) : 0;
    const res = await ac.getTransactions(begin, size) as [TxRecord];
    res.forEach(async item => { 
        const callers = item.caller.map(val => val.toText()).join(",");
        const op = handleOP(item.op);
        const sqlStr = `INSERT INTO token_history (caller, op, tx_index, tx_from, tx_to, amount, fee, timestamp, canisterId) 
        VALUES ('${callers}', '${op}', ${Number(item.index)}, '${item.from.toText()}', '${item.to.toText()}', '${Number(item.amount)}', '${Number(item.fee)}', ${Math.floor(Number(item.timestamp)/1e6)}, '${workerData.canisterId}')`;
        const [ok, err]= sqlClient.run(sqlStr);
        if(!ok){
            log.error(err);
        }
    });
    process.exit(0);
})();


