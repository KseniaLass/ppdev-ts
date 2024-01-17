import { IChartRequest, IChartResponse, ICandle } from "./dto";
// import { Chart } from "chart.js/auto";
require('../css/app.scss');

function init() { 
  /** Elements */
    const $form = document.getElementById("js-form");
    const $formError = document.getElementById("js-form-error");
    const $chart = <HTMLCanvasElement> document.getElementById('js-chart');
    const ctx = $chart.getContext('2d');

    ctx.canvas.width = 1000;
    ctx.canvas.height = 250;

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
            
            console.log(JSON.stringify(generateChart(response)));
            // let chart = new Chart(ctx, {
            //     type: 'candlestick',
            //     data: {
            //         datasets: [{
            //             label: 'CHRT - Chart.js Corporation',
            //             data: generateChart(response)
            //         }]
            //     }
            // });
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

function generateChart(data: IChartResponse): ICandle[] {
  let formatData = [];
  let lastBlockNumber = data.blocks[0].blockNumber;
  let lastOpen = +data.poolInfo.startingPrice;
  let lastHigh = 0;
  let lastLow = 0;
  let lastClose = 0;

  for (let i = 0; i < data.blocks.length - 1; i++) {
      let x = lastBlockNumber,
          o = lastOpen,
          h = lastHigh,
          l = lastLow,
          c = lastClose;
      if (lastBlockNumber === data.blocks[i].blockNumber) {
          h = 0;
          l = Infinity;
          data.blocks[i].prices.forEach((price, k) => {
              if (+price.priceAfter > h) h = +price.priceAfter;
              if (+price.priceAfter < l) l = +price.priceAfter;
              if (k === data.blocks[i].prices.length - 1) {
                  c = +price.priceAfter;
              }
          });
      }
      formatData.push({x, o, h, l, c});
      lastOpen = c;
      lastHigh = h;
      lastLow = l;
      lastClose = c;
      lastBlockNumber++;
  }
  return formatData;
  
}

init();