import { IChartRequest, IChartResponse, ICandle, IPrice, IBlock } from "./dto";
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
                
                return '<div class="arrow_box">' +
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
        try {
            const target = <HTMLFormElement> event.currentTarget;        
            const formData = new FormData(target);
            generateChart({
                poolAddress: formData.get('poolAddress') as string,
                startingBlock: formData.get('startingBlock') as string,
                blocks: formData.get('blocks') as string
            });            
        } catch (error) {
            console.error('err', error);
            $formError.innerText = error.error;
        }
    });

    function setValesToForm(query: IChartRequest): void {
        $poolAddress.value = query.poolAddress;
        $startingBlock.value = query.startingBlock;
        $blocks.value = query.blocks;
    }


    async function generateChart(query: IChartRequest): Promise<void> {
        try {
            const response: IChartResponse = await requestChartData(query);
            const data = formatChartData(response);
            $poolInfo.innerHTML = formatJSONtoHTML(response.poolInfo); 
            $chart.style.display = "block"; 
            chart.updateSeries([{
                data
            }])
        
        } catch (error) {
            console.error(error);
        }
    }
    
    async function requestChartData(query: IChartRequest): Promise<IChartResponse>  {
      const baseUrl = `http://g.cybara.io/api`;
      const search = `?poolAddress=${query.poolAddress}&startingBlock=${query.startingBlock}&blocks=${query.blocks}`;
      const response = await fetch(`${baseUrl}${search}`, {
          method: 'GET',
      });
      const json = await response.json();
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
                    txURL: `https://etherscan.io/tx/${price.txHash}`,
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
            if (key === 'txURL') {
                html += `<strong>${key} </strong><a href=${json[key]} target="_blank">${json[key]}</a></br>`
            } else {
                html += `<strong>${key} </strong><span>${json[key]}</span></br>`;
            }
        }
        return html;
    }
}

init();