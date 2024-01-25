interface IPoolInfo {
    poolAddress: string;
    token0: string;
    token1: string;
    ticker0: string;
    ticker1: string;
    decimals0: number;
    decimals1: number;
    poolVersion: string;
    startingPrice: string;
}
interface IPrice {
    txHash: string;
    priceAfter: string;
    liquidity0: string;
    liquidity1: string;
    txURL?: string;
}
interface IBlock {
    blockNumber: number;
    prices: IPrice[]
}

// y: [open, high, low, close]
interface ICandle {
    x: string,
    y: [string, string, string, string],
    prices: IPrice[]
}

interface IPool {
    Address: string,
    Name: string,
    Token0: string,
    Token1: string,
    Liquidity0: string,
    Liquidity1: string
}

interface IChartResponse {
    success: Boolean
    error: string;
    poolInfo: IPoolInfo
    blocks: IBlock[]
}

interface IChartRequest {
    poolAddress: string;
    startingBlock: string;
    blocks: string;
}

interface IHashRequest {
    txHash: string;
}

interface IHashResponse {
    success: Boolean
    error: string;
    txHash: string;
    pools: IPool[];
    block: number;
}

interface IValidationError {
    success: boolean;
    error: string;
}

export {IChartResponse, IChartRequest, ICandle, IPrice, IBlock, IValidationError, IHashRequest, IHashResponse, IPool}