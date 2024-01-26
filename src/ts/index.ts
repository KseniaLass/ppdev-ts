import {ICandle, IChartRequest, IChartResponse, IHashRequest, IPrice, IValidationError, IHashResponse, IPool} from "./dto";
import ApexCharts from 'apexcharts'

require('../css/app.scss');

function init() {

    /** Elements */
    const $chartForm = <HTMLFormElement> document.getElementById("js-ChartForm");
    const $txHashForm = <HTMLFormElement> document.getElementById("txHashForm");

    const $txHashSection = document.getElementById("txHashSection");
    const $chartSection = document.getElementById("chartSection");

    const $poolsByHash = document.getElementById("poolsByHash");

    const $poolAddressInput = <HTMLInputElement>document.getElementById("poolAddress");
    const $startingBlockInput = <HTMLInputElement>document.getElementById("startingBlock");
    const $blocksInput = <HTMLInputElement>document.getElementById("blocks");
    const $txHashInput = <HTMLInputElement>document.getElementById("txHash");

    const $chart = document.getElementById("js-chart");
    const $poolInfo = document.getElementById("js-poolInfo");
    const $blockInfo = document.getElementById("js-blockInfo");
    const $loader = document.getElementById("loader");

    /** Data */
    let hashResult = <IHashResponse> null;

    /** Check get params */
    const queryString = location.search.substring(1);
    if (queryString.length) {
        let URLParse = JSON.parse('{"' + decodeURI(queryString).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
        if (URLParse.poolAddress && URLParse.startingBlock && URLParse.blocks) {
            let query = {
                poolAddress: URLParse.poolAddress,
                startingBlock: URLParse.startingBlock,
                blocks: URLParse.blocks
            };
            $txHashSection.classList.add('hide');
            $chartSection.classList.remove('hide');
            generateChart(query);
        } else if (URLParse.txHash) {
            let query = {
                txHash: URLParse.txHash
            };
            $txHashSection.classList.remove('hide');
            $chartSection.classList.add('hide');
            generateHash(query);
            $txHashInput.value = query.txHash;
        } else {
            $txHashSection.classList.remove('hide');
            $chartSection.classList.add('hide');
        }
    }

    /** Render Chart */
    const chartOptions = {
        series: [
            {}
        ],
        chart: {
            type: 'candlestick',
            height: 500,
            events: {
                //@ts-ignore
                markerClick: function (_: any, {w}, {seriesIndex, dataPointIndex}) {
                    $blockInfo.innerHTML = '';
                    let candle = w.config.series[seriesIndex].data[dataPointIndex];
                    let blocksHTML = '';
                    candle.prices.forEach((val: IPrice) => {
                        blocksHTML += `<div class="blockInfo__item">${formatJSONtoHTML(val)}</div>`;
                    })
                    $blockInfo.innerHTML = blocksHTML;
                }
            }
        },
        title: {
            text: 'PP Chart',
            align: 'left'
        },
        xaxis: {
            type: 'category'
        },
        yaxis: {
            tooltip: {
                enabled: true
            }
        },
        tooltip: {
            //@ts-ignore
            custom: function ({series, seriesIndex, dataPointIndex, w}) {
                let block = w.config.series[seriesIndex].data[dataPointIndex];

                return '<div class="chart__tooltip">' +
                    '<strong>Open:</strong><span>' + block.y[0] + '</span></br>' +
                    '<strong>High:</strong><span>' + block.y[1] + '</span></br>' +
                    '<strong>Low:</strong><span>' + block.y[2] + '</span></br>' +
                    '<strong>Close:</strong><span>' + block.y[3] + '</span></br>' +
                    '</div>'
            }
        }
    }
    const chart = new ApexCharts($chart, chartOptions);
    chart.render();

    /** Submit chart form */
    $chartForm.addEventListener("submit", async (event: SubmitEvent) => {
        event.preventDefault();
        generateChart({
            poolAddress: $poolAddressInput.value,
            startingBlock: $startingBlockInput.value,
            blocks: $blocksInput.value
        });
    });

    /** Submit txHash form */
    $txHashForm.addEventListener("submit", async (event: SubmitEvent) => {
        event.preventDefault();
        const query = {
            txHash: $txHashInput.value
        }
        generateHash(query);
    });

    async function generateHash(query: IHashRequest): Promise<void> {
        let error = $txHashForm.querySelector(".js-form-error");
        error.innerHTML = '';
        try {
            const response: IHashResponse = await baseGETRequest(`http://g.cybara.io/detect?txHash=${query.txHash}`);
            $chartSection.classList.add('hide');
            $txHashSection.classList.remove('hide');
            $chartForm.reset();
            if (response.pools.length === 1) {
                generateChart({
                    poolAddress: response.pools[0].Address,
                    startingBlock: String(response.block),
                    blocks: '100'
                })
            } else {
                hashResult = response;
                let poolsHTML = "";
                response.pools.forEach((val: IPool, i: number) => {
                   poolsHTML += `<a href="${document.location.origin}${document.location.pathname}?poolAddress=${val.Address}&startingBlock=${response.block}&blocks=100">
                        <div class="poolsInfo__item">${formatJSONtoHTML(val)}</div>
                   </a>`;
                });
                $poolsByHash.innerHTML = poolsHTML;
                setValuesToURL(query);
            }
        } catch (e) {
            error.innerHTML = e.error;
        }
    }

    async function generateChart(query: IChartRequest): Promise<void> {
        let error = $chartForm.querySelector(".js-form-error");
        error.innerHTML = '';
        try {
            const response: IChartResponse = await baseGETRequest(`http://g.cybara.io/api?poolAddress=${query.poolAddress}&startingBlock=${query.startingBlock}&blocks=${query.blocks}`);
            const data = formatChartData(response);
            setValesToForm(query);
            $poolInfo.innerHTML = formatJSONtoHTML(response.poolInfo);
            $txHashSection.classList.add('hide');
            $chartSection.classList.remove('hide');
            $txHashForm.reset();
            chart.updateSeries([{
                data
            }]);
            setValuesToURL(query);
        } catch (e) {
            error.innerHTML = e.error;
        }
    }

    async function baseGETRequest(url: string): Promise<any> {
        beforeRequest();
        const response = await fetch(url, {
            method: 'GET',
        });
        const json = await response.json();
        afterRequest();
        if (json.success) {
            return json
        } else {
            throw json
        }
    }

    function setValesToForm(query: IChartRequest): void {
        $poolAddressInput.value = query.poolAddress;
        $startingBlockInput.value = query.startingBlock;
        $blocksInput.value = query.blocks;
    }

    function setValuesToURL(query: any): void {
        const url = new URL(`${window.location.origin}${window.location.pathname}`);
        for (let key in query) {
            url.searchParams.set(key, query[key]);
        }
        history.pushState({}, "", url);
    }

    function formatChartData(data: IChartResponse): ICandle[] {
        let formatData: ICandle[] = [];
        let loopLength: number = data.blocks[data.blocks.length - 1].blockNumber - data.blocks[0].blockNumber;
        let lastBlockNumber: number = data.blocks[0].blockNumber - 1;
        let lastOpen: string = data.poolInfo.startingPrice;
        let lastHigh: string = '';
        let lastLow: string = '';
        let lastClose: string = data.poolInfo.startingPrice;

        let i = 0;
        while (formatData.length - 1 !== loopLength) {
            lastBlockNumber++;
            let prices: IPrice[] = [];
            if (data.blocks[i].blockNumber === lastBlockNumber) {
                let high: number = 0,
                    low: number = Infinity;
                lastOpen = lastClose;
                data.blocks[i].prices.forEach((price: IPrice, k: number): void => {
                    if (+price.priceAfter > high) {
                        lastHigh = price.priceAfter
                        high = +price.priceAfter;
                    }
                    if (+price.priceAfter < low) {
                        lastLow = price.priceAfter
                        low = +price.priceAfter;
                    }
                    if (k === data.blocks[i].prices.length - 1) {
                        lastClose = price.priceAfter;
                    }
                    prices.push({
                        ...price
                    })
                });
                i++;
                formatData.push({
                    x: lastBlockNumber + '',
                    y: [lastOpen, lastHigh, lastLow, lastClose],
                    prices
                });
            } else {
                formatData.push({
                    x: lastBlockNumber + '',
                    y: [lastClose, lastClose, lastClose, lastClose],
                    prices
                });
            }
        }
        return formatData;
    }

    function formatJSONtoHTML(json: any): string {
        let html = '';
        for (let key in json) {
            let link = '';
            switch (key) {
                case 'txHash':
                    link = 'https://etherscan.io/tx/';
                    break;
                case 'poolAddress':
                    link = 'https://etherscan.io/address/';
                    break;
                case 'token0':
                case 'token1':
                    link = 'https://etherscan.io/token/';
                    break;
            }
            if (link.length) {
                html += `<a href=${link}${json[key]} target="_blank"><strong>${key}</strong></a></br>`
            } else {
                html += `<strong>${key}: </strong><span>${json[key]}</span></br>`;
            }
        }
        return html;
    }

    function beforeRequest(): void {
        $loader.classList.remove('hide');
        $chartForm.classList.add('disabled');
        $txHashForm.classList.add('disabled');
    }

    function afterRequest(): void {
        $loader.classList.add('hide');
        $chartForm.classList.remove('disabled');
        $txHashForm.classList.remove('disabled');
        $poolInfo.classList.remove('hide');
    }
}

init();