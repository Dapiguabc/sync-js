// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default ({ IDL }) => {
    // const TxReceipt = IDL.Variant({
    //     err: IDL.Variant({
    //         InsufficientAllowance: IDL.NULL,
    //         InsufficientBalance: IDL.NULL,
    //     }),
    //     ok: IDL.Nat
    // });

    const TokenInfo = IDL.Record({
        canisterId: IDL.Principal,
        decimals: IDL.Nat8,
        fee: IDL.Nat,
        index: IDL.Nat,
        logo: IDL.Text,
        name: IDL.Text,
        owner: IDL.Principal,
        symbol: IDL.Text,
        timestamp: IDL.Int,
        totalSupply: IDL.Nat,
    });

    const TokenRegistry = IDL.Service({
        addToken: IDL.Func([IDL.Principal], [IDL.Bool], []),
        getCyclesBalance: IDL.Func([], [IDL.Nat], ["query"]),
        getMaxTokenNumber: IDL.Func([], [IDL.Nat], ["query"]),
        getMaxTokenNumberPerUser: IDL.Func([], [IDL.Nat], ["query"]),
        getTokenCount: IDL.Func([], [IDL.Nat], ["query"]),
        getTokenInfo: IDL.Func([IDL.Principal], [IDL.Opt(TokenInfo)], ["query"]),
        getTokenList: IDL.Func([], [IDL.Vec(TokenInfo)], ["query"]),
        getTokens: IDL.Func([IDL.Nat, IDL.Nat], [IDL.Vec(TokenInfo), IDL.Nat], ["query"]),
        getTokensByName: IDL.Func([IDL.Text ,IDL.Nat, IDL.Nat], [IDL.Vec(TokenInfo), IDL.Nat], ["query"]),
        getUserTokenList: IDL.Func([IDL.Principal], [IDL.Vec(TokenInfo), IDL.Nat], ["query"]),
        getUserTokenNumber: IDL.Func([IDL.Principal], [IDL.Nat], ["query"])
    });
    return TokenRegistry;
};