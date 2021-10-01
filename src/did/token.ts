// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default ({ IDL }) => {
    const TxReceipt = IDL.Variant({
        err: IDL.Variant({
            AmountTooSmall: IDL.NULL,
            InsufficientAllowance: IDL.NULL,
            InsufficientBalance: IDL.NULL,
            Unauthorized: IDL.NULL,
        }),
        ok: IDL.Nat
    });
    const Operation = IDL.Variant({
        approve: IDL.Null,
        burn: IDL.Nat64,
        mint: IDL.Null,
        transfer: IDL.Null,
        transferFrom: IDL.Null,
    });
    const TxRecord = IDL.Record({
        caller: IDL.Opt(IDL.Principal),
        op: Operation,
        index: IDL.Nat,
        from: IDL.Principal,
        to: IDL.Principal,
        amount: IDL.Nat,
        fee: IDL.Nat,
        timestamp: IDL.Int,
    });
    const Metadata = IDL.Record({
        decimals: IDL.Nat8,
        fee: IDL.Nat,
        logo: IDL.Text,
        name: IDL.Text,
        owner: IDL.Principal,
        symbol: IDL.Text,
        totalSupply: IDL.Nat,
    });
    const TokenInfo = IDL.Record({
        cycles: IDL.Nat,
        deployTime: IDL.Int,
        feeTo: IDL.Principal,
        historySize: IDL.Nat,
        holderNumber: IDL.Nat,
        metadata: Metadata,
    });

    const TransactionNotification = IDL.Record({
        amount: IDL.Record({e8s: IDL.Nat64}),
        block_height: IDL.Nat64,
        from: IDL.Principal,
        from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
        memo: IDL.Nat64,
        to: IDL.Principal,
        to_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    });

    const Token = IDL.Service({
        allowance: IDL.Func([IDL.Principal, IDL.Principal], [IDL.Nat], ['query']),
        approve: IDL.Func([IDL.Principal, IDL.Nat], [TxReceipt], []),
        balanceOf: IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
        decimals: IDL.Func([], [IDL.Nat8], ['query']),
        getAllowanceSize: IDL.Func([], [IDL.Nat], ['query']),
        getHolders: IDL.Func([IDL.Nat, IDL.Nat], [IDL.Vec(IDL.Record({
            id: IDL.Principal,
            balance: IDL.Nat
        }))], ['query']),
        getMetadata: IDL.Func([], [Metadata], ['query']),

        getPendings: IDL.Func([], [IDL.Vec(TxRecord)], []),
        getTokenInfo: IDL.Func([], [TokenInfo], ['query']),
        getTransaction: IDL.Func([IDL.Nat], [TxRecord], ['query']),
        getTransactions: IDL.Func([IDL.Nat, IDL.Nat], [IDL.Vec(TxRecord)], ['query']),
        getUserApprovals: IDL.Func([IDL.Principal], [IDL.Vec(IDL.Record({
            id: IDL.Principal,
            balance: IDL.Nat
        }))], ['query']),
        getUserTransactionAmount: IDL.Func([IDL.Principal], [IDL.Nat], ['query']),
        getUserTransactions: IDL.Func([IDL.Principal, IDL.Nat, IDL.Nat], [IDL.Vec(TxRecord)], ['query']),
        historySize: IDL.Func([], [IDL.Nat], ['query']),
        logo: IDL.Func([], [IDL.Text], ['query']),
        name: IDL.Func([], [IDL.Text], ['query']),
        restoreBurn: IDL.Func([IDL.Nat], [IDL.Bool], []),
        setFee: IDL.Func([IDL.Nat], [IDL.Bool], []),
        setFeeTo: IDL.Func([IDL.Principal], [IDL.Bool], []),
        setLogo: IDL.Func([IDL.Text], [IDL.Bool], []),
        setOwner: IDL.Func([IDL.Principal], [IDL.Bool], []),
        setThresh: IDL.Func([IDL.Nat64], [], ['oneway']),
        symbol: IDL.Func([], [IDL.Text], ['query']),
        totalSupply: IDL.Func([], [IDL.Nat], ['query']),
        transaction_notification: IDL.Func([TransactionNotification], [TxReceipt], []),
        transfer: IDL.Func([IDL.Principal, IDL.Nat], [TxReceipt], []),
        transferFrom: IDL.Func([IDL.Principal, IDL.Principal, IDL.Nat], [TxReceipt], []),
        withdraw: IDL.Func([IDL.Nat64, IDL.Text], [TxReceipt], []),
    });
    return Token;
};