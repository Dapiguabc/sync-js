/* eslint-disable @typescript-eslint/no-explicit-any */
import { Principal } from "@dfinity/principal"
export declare type TxRecord = {
    op: {
        [x: string]: any;
    },
    to: Principal,
    fee: bigint,
    from: Principal ,
    timestamp: bigint,
    caller: [Principal],
    index: bigint,
    amount: bigint
}

export declare type TokenInfo = {
    canisterId: Principal,
    decimals: bigint,
    fee: bigint,
    index: bigint,
    logo: string,
    name: string,
    owner: Principal,
    symbol: string,
    timestamp: bigint,
    totalSupply: bigint,
}


export declare type DswapTxRecord = {
    amount: bigint,
    amount0: bigint,
    amount1: bigint,
    caller: Principal,
    fee: bigint,
    from: Principal,
    index: bigint,
    op: {
        [x: string]: any;
    },
    timestamp: bigint,
    to: Principal,
    tokenId: string,
}

// 0: stop; 1: running; 2: processing; 3: error 4: deleted
export declare type JobStatus = 0 | 1 | 2 | 3;

export declare interface ConfigRow {
    name: string,
    canisterId: string,
    type: string,
    db: string,
    cron: string,
    status?: JobStatus,
    desc?: string
}


export declare interface Response {
    code: number,
    msg: string,
    data: Record<string, string>
}