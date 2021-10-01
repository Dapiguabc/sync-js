// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default ({ IDL }) => {
    const Operation = IDL.Variant({
        addLiquidity: IDL.Null,
        createPair: IDL.Null,
        deposit: IDL.Null,
        lpApprove: IDL.Null,
        lpTransfer: IDL.Null,
        lpTransferFrom: IDL.Null,
        removeLiquidity: IDL.Null,
        swap: IDL.Null,
        tokenApprove: IDL.Null,
        tokenTransfer: IDL.Null,
        tokenTransferFrom: IDL.Null,
        withdraw: IDL.Null,
    });
    const TxRecord = IDL.Record({
        amount: IDL.Nat,
        amount0: IDL.Nat,
        amount1: IDL.Nat,
        caller: IDL.Principal,
        fee: IDL.Nat,
        from: IDL.Principal,
        index: IDL.Nat,
        op: Operation,
        timestamp: IDL.Int,
        to: IDL.Principal,
        tokenId: IDL.Text,
    });

    const BucketInfoExt = IDL.Record({
        bucketId: IDL.Principal,
        id: IDL.Nat,
        length: IDL.Nat,
        start: IDL.Nat,
    });
    const Status = IDL.Record({
        buckets: IDL.Vec(BucketInfoExt),
        bufferSize: IDL.Nat,
        chunkSize: IDL.Nat,
        cycles: IDL.Nat,
        dswap: IDL.Principal,
        flushing: IDL.Bool,
        memSize: IDL.Nat,
        owner: IDL.Principal,
        recordsPerBucket: IDL.Nat,
        txAmount: IDL.Nat,
    });
    const TokenRegistry = IDL.Service({
        // It seems not a function.
        //historySize: IDL.Func([], [IDL.Nat], []),
        getStatus: IDL.Func([], [Status], ['query']),
        getTransaction: IDL.Func([IDL.Nat], [TxRecord], []),
        getTransactions: IDL.Func([IDL.Nat, IDL.Nat], [IDL.Vec(TxRecord)], []),
    });
    return TokenRegistry;
};