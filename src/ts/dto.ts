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
}
interface IBlock {
    blockNumber: number;
    prices: IPrice[]
}
interface ICandle {
    x: number;
    o: number;
    h: number;
    l: number;
    c: number;
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

export {IChartResponse, IChartRequest, ICandle}