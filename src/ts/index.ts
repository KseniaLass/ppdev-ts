import { IChartRequest, IChartResponse, ICandle, IPrice, IBlock, IValidationError } from "./dto";
import ApexCharts from 'apexcharts'
require('../css/app.scss');

function init() { 

    /** Elements */
    const $form = document.getElementById("js-form");
    const $poolAddress = <HTMLInputElement> document.getElementById("js-poolAddress");
    const $startingBlock = <HTMLInputElement> document.getElementById("js-startingBlock");
    const $blocks = <HTMLInputElement> document.getElementById("js-blocks");
    const $formError = document.getElementById("js-form-error");
    const $chart = document.getElementById('js-chart');
    const $poolInfo = document.getElementById('js-poolInfo');
    const $blockInfo = document.getElementById('js-blockInfo');
    const $loader = document.getElementById('js-loader');

    /** Check get params */
    const queryString = location.search.substring(1);
    if (queryString.length) {
        let URLParse = JSON.parse('{"' + decodeURI(queryString).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
        if (URLParse.poolAddress && URLParse.startingBlock && URLParse.blocks) {
            let query = {
                poolAddress: URLParse.poolAddress,
                startingBlock: URLParse.startingBlock,
                blocks: URLParse.blocks
            };
            generateChart(query);
            setValesToForm(query);
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
                markerClick: function(_: any, {w}, { seriesIndex, dataPointIndex}) {
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
            custom: function({series, seriesIndex, dataPointIndex, w}) {
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
    

    /** Submit form */
    $form.addEventListener("submit", async (event: SubmitEvent) => {
        event.preventDefault();   
        const target = <HTMLFormElement> event.currentTarget;        
        const formData = new FormData(target);
        const query = {
            poolAddress: formData.get('poolAddress') as string,
            startingBlock: formData.get('startingBlock') as string,
            blocks: formData.get('blocks') as string
        }
        generateChart(query); 
    });

    function setValesToForm(query: IChartRequest): void {
        $poolAddress.value = query.poolAddress;
        $startingBlock.value = query.startingBlock;
        $blocks.value = query.blocks;
    }

    function setValuesToURL(query: IChartRequest): void {
        const url = new URL(window.location.origin);
        url.searchParams.set('poolAddress', query.poolAddress);
        url.searchParams.set('startingBlock', query.startingBlock);
        url.searchParams.set('blocks', query.blocks);
        history.pushState({}, "", url);
    }

    async function generateChart(query: IChartRequest): Promise<void> {
        try {
            const response: IChartResponse = await requestChartData(query);
            const data = formatChartData(response);
            $poolInfo.innerHTML = formatJSONtoHTML(response.poolInfo); 
            $chart.style.display = "block"; 
            chart.updateSeries([{
                data
            }]);
            setValuesToURL(query);
        } catch (error) {
            $formError.innerText = error.error;
        }
    }
    async function requestChartData(query: IChartRequest): Promise<IChartResponse>  {
        let validation = validateRequest(query);
        if (!validation.success) {
            throw validation;
        }
        beforeRequest();
        const baseUrl = `http://g.cybara.io/api`;
        const search = `?poolAddress=${query.poolAddress}&startingBlock=${query.startingBlock}&blocks=${query.blocks}`;
        const response = await fetch(`${baseUrl}${search}`, {
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
    
    function formatChartData(data: IChartResponse): ICandle[] {
      let formatData: ICandle[] = [];
      let loopLength: number = data.blocks[data.blocks.length - 1].blockNumber - data.blocks[0].blockNumber;
      let lastBlockNumber: number = data.blocks[0].blockNumber - 1;
      let lastOpen: string = data.poolInfo.startingPrice;
      let lastHigh: string = '';
      let lastLow: string = '';
      let lastClose: string = data.poolInfo.startingPrice;
    
      let i = 0;
      while(formatData.length - 1 !== loopLength) {
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
        }
        
        formatData.push({
            x: lastBlockNumber + '',
            y: [lastOpen, lastHigh, lastLow, lastHigh],
            prices
        });
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
            html += `<strong>${key}: </strong>`
            if (link.length) {
                html += `<a href=${link}${json[key]} target="_blank">${link}${json[key]}</a></br>`
            } else {
                html += `<span>${json[key]}</span></br>`;
            }
        }
        return html;
    }

    function beforeRequest(): void {
        $loader.classList.remove('hide');
        $formError.classList.add('hide');
        $form.classList.add('disabled');
    }

    function afterRequest(): void {
        $loader.classList.add('hide');
        $form.classList.remove('disabled');
        $poolInfo.classList.remove('hide');
    }

    function validateRequest(query: IChartRequest): IValidationError {
        if (!/^0x\w{40}/.test(query.poolAddress)) {
            return {
                success: false,
                error: 'Invalid value poolAddress. Only hash string allowed: starts from 0x and length 42.'
            }
        } else if (!/\d/gm.test(query.startingBlock)) {
            return {
                success: false,
                error: 'Invalid value startingBlock. Only numbers allowed.'
            }
        } else if (!/\d/gm.test(query.blocks)) {
            return {
                success: false,
                error: 'Invalid value blocks. Only numbers allowed.'
            }
        } else {
            return {
                success: true,
                error: ''
            }
        }
    }
}

init();