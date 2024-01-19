import { IChartRequest, IChartResponse, ICandle } from "./dto";
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

function formatChartData(data: IChartResponse): any {
  let formatData = [];
  let loopLength = data.blocks[data.blocks.length - 1].blockNumber - data.blocks[0].blockNumber;
  let lastBlockNumber = data.blocks[0].blockNumber - 1;
  let lastOpen = +data.poolInfo.startingPrice;
  let lastHigh = 0;
  let lastLow = 0;
  let lastClose = 0;

  let i = 0;
  while(formatData.length - 1 !== loopLength) {
    lastBlockNumber++;
    let open = lastOpen,
        high = lastHigh,
        low = lastLow,
        close = lastClose;
    if (data.blocks[i].blockNumber === lastBlockNumber) {
        high = 0;
        low = Infinity;
        data.blocks[i].prices.forEach((price, k) => {
            if (+price.priceAfter > high) high = +price.priceAfter;
            if (+price.priceAfter < low) low = +price.priceAfter;
            if (k === data.blocks[i].prices.length - 1) {
                close = +price.priceAfter;
            }
        });
        i++;
    }
    formatData.push({x: lastBlockNumber, y: [open, high, low, close]});
      lastOpen = close;
      lastHigh = high;
      lastLow = low;
      lastClose = close;
  }
  return formatData;
  
}

init();