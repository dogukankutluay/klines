const interval = "1d";
const period = 14;

const axiosConfig = {
  baseURL: "https://api.binance.com",
};
function calculateRSI(prices, symbol) {
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const priceDiff = prices[i][4] - prices[i - 1][4];
    if (priceDiff > 0) {
      gains += priceDiff;
    } else {
      losses += Math.abs(priceDiff);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const priceDiff = prices[i][4] - prices[i - 1][4];
    if (priceDiff > 0) {
      avgGain = (avgGain * (period - 1) + priceDiff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(priceDiff)) / period;
    }
  }

  const relativeStrength = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + relativeStrength);

  function formatNumber(number) {
    const formattedNumber = number.toFixed(3);
    const [integerPart, decimalPart] = formattedNumber.split(".");
    const decimalDigits = decimalPart.substring(0, 3);

    return `${integerPart}.${decimalDigits}`;
  }
  return { symbol, rsi: formatNumber(rsi) };
}

async function getOHLCVData(symbol) {
  const response = await axios.get(
    `/api/v3/klines?symbol=${symbol}&interval=${interval}`,
    axiosConfig
  );

  return calculateRSI(response.data, symbol);
}

async function getExchangeInfo() {
  const response = await axios.get(`/api/v3/exchangeInfo`, axiosConfig);
  const symbols = response.data.symbols.map((symbol) => symbol.symbol);
  return symbols;
}

async function makeUI(datas) {
  const tableElement = document.getElementById("table");
  datas = datas.sort((a, b) => a.rsi - b.rsi);
  for (const data of datas) {
    const tr = document.createElement("tr");

    const symbol = document.createElement("td");
    symbol.textContent = data.symbol;

    const rsi = document.createElement("td");
    rsi.textContent = data.rsi;

    tr.appendChild(symbol);
    tr.appendChild(rsi);
    tableElement.appendChild(tr);
  }
}
async function main() {
  try {
    const infos = await getExchangeInfo();
    const filters = infos.slice(0, 30);
    const cals = filters.map((info) => getOHLCVData(info));
    const datas = await Promise.all(cals);
    makeUI(datas);
  } catch (error) {
    console.error("Hata oluştu:", error);
  }
}

main();
