import { Actor, HttpAgent } from "@dfinity/agent";
import IDL from "../did/index.js";
import SqlClient from "../sql.js";
import nodefetch  from "node-fetch";
import { TokenInfo } from "../shim.js";
import { workerData } from "worker_threads";
import logger from "../log.js";

const log = logger.scope("registry job scope");

interface RegistryRow {
    canisterId: string,
    decimals: number,
    fee: string,
    tindex: number,
    logo: string,
    name: string,
    owner: string,
    symbol: string,
    timestamp: number,
    totalSupply: string,
}

(async () => {
    const sqlClient = SqlClient.createSqlClient(workerData.db);
    sqlClient.exec(       
        `CREATE TABLE IF NOT EXISTS token_registry (
            canisterId TEXT NOT NULL,
            decimals INTEGER NOT NULL,
            fee TEXT NOT NULL,
            tindex INTEGER NOT NULL PRIMARY KEY,
            logo TEXT NOT NULL,
            name TEXT NOT NULL,
            owner TEXT NOT NULL,
            symbol TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            totalSupply TEXT NOT NULL
        )`
    );
    const ac = Actor.createActor(IDL.IDL_REGISTRY, {
        agent: new HttpAgent({
            host: process.env.ICP_HOST || "https://ic0.app/",
            fetch: nodefetch as unknown as typeof fetch,
        }),
        canisterId: workerData.canisterId,
    });
    const size: BigInt = await ac.getTokenCount() as BigInt;
    const row = sqlClient.get<RegistryRow>("select * from token_registry order by  tindex desc limit 1");
    const begin = row? BigInt(row.tindex + 1) : 0;
    const res = await ac.getTokens(begin, size) as [TokenInfo[], bigint];
    res[0].forEach(async item => { 
        const sqlStr =  `INSERT INTO token_registry (canisterId, decimals, fee, tindex, logo, name, owner, symbol, timestamp, totalSupply)
        VALUES ('${item.canisterId.toText()}', ${Number(item.decimals)}, '${Number(item.fee)}', ${Number(item.index)}, '${item.logo}', '${item.name}', '${item.owner.toText()}', '${item.symbol}', ${Math.floor(Number(item.timestamp)/1e6)}, '${Number(item.totalSupply)}')`;
        const [ok, err]= sqlClient.run(sqlStr);
        if(!ok){
            log.error(err);
        }
    });
    process.exit(0);
})();


