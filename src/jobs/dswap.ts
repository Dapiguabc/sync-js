/* eslint-disable @typescript-eslint/no-explicit-any */
import { Actor, HttpAgent } from "@dfinity/agent";
import IDL from "../did/index.js";
import SqlClient from "../sql.js";
import nodefetch  from "node-fetch";
import { DswapTxRecord } from "../shim.js";
import { workerData } from "worker_threads";
import logger from "../log.js";

const log = logger.scope("dswap job scope");

interface TransactionRow {
    amount: string,
    amount0: string,
    amount1: string,
    caller: string,
    fee: string,
    tx_from: string,
    tx_index: number,
    op: string,
    timestamp: number,
    tx_to: string,
    tokenId: string,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleOP(op: {[x: string]: any;}): string {
    return Object.keys(op).join(",");
} 

(async () => {
    const sqlClient = SqlClient.createSqlClient(workerData.db);
    sqlClient.exec(       
        `CREATE TABLE IF NOT EXISTS token_dswap (
            amount TEXT NOT NULL,
            amount0 TEXT NOT NULL,
            amount1 TEXT NOT NULL,
            caller TEXT NOT NULL,
            fee TEXT NOT NULL,
            tx_from TEXT NOT NULL,
            tx_index INTEGER NOT NULL PRIMARY KEY,
            op TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            tx_to TEXT NOT NULL,
            tokenId TEXT NOT NULL
        )`
    );
    const ac = Actor.createActor(IDL.IDL_DSWAP, {
        agent: new HttpAgent({
            host: process.env.ICP_HOST || "https://ic0.app/",
            fetch: nodefetch as unknown as typeof fetch,
        }),
        canisterId: workerData.canisterId,
    });
    const status = await ac.getStatus() as Record<string, any>;
    const size = status?.txAmount;
    if(!size){
        return
    }
    const row = sqlClient.get<TransactionRow>("select *  from token_dswap order by  tx_index desc limit 1");
    const begin = row? BigInt(row.tx_index + 1) : 0;
    const res = await ac.getTransactions(begin, size) as [DswapTxRecord];
    res.forEach(async item => { 
        const op = handleOP(item.op);
        const sqlStr =  `INSERT INTO token_dswap (amount, amount0, amount1, caller, fee, tx_from, tx_index, op, timestamp, tx_to, tokenId)
        VALUES ('${Number(item.amount)}', '${Number(item.amount0)}', '${Number(item.amount1)}', '${item.caller.toText()}', '${Number(item.fee)}', '${item.from.toText()}', ${Number(item.index)}, '${op}', ${Math.floor(Number(item.timestamp)/1e6)}, '${item.to.toText()}', '${item.tokenId}')`;
        const [ok, err]= sqlClient.run(sqlStr);
        if(!ok){
            log.error(err);
        }
    });
    process.exit(0);
})();


