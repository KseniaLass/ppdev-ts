import { IChartRequest, IChartResponse, ICandle, IPrice } from "./dto";
import ApexCharts from 'apexcharts'
require('../css/app.scss');

function init() { 

  /** Elements */
    const $form = document.getElementById("js-form");
    const $formError = document.getElementById("js-form-error");
    const $chart = document.getElementById('js-chart');

    /** Send request for data */
    $form.addEventListener("submit", async (event: SubmitEvent) => {
        event.preventDefault();        
        try {
            const target = <HTMLFormElement> event.currentTarget;        
            const formData = new FormData(target);
            const response = await requestChartData({
                poolAddress: formData.get('poolAddress') as string,
                startingBlock: formData.get('startingBlock') as string,
                blocks: formData.get('blocks') as string
            });
            
            const data = formatChartData(response);            
            
            const chartOptions = {
                series: [
                    { data }
                ],
                chart: {
                    type: 'candlestick',
                    height: 350
                },
                title: {
                    text: 'CandleStick Chart',
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
            
        } catch (error) {
            console.error('err', error);
            $formError.innerText = error.error;
        }
  });
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
        });
        i++;
    }
    
    formatData.push({x: lastBlockNumber + '', y: [lastOpen, lastHigh, lastLow, lastHigh]});
  }
  return formatData;
}

init();