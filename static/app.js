// static/app.js
// Modern, dynamic UI logic for Stock Dashboard

// --- Theme Toggle ---
function setTheme(dark) {
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem("theme", dark ? "dark" : "light");
}

document.getElementById("theme-toggle").onclick = function () {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
};

(function initTheme() {
  const theme = localStorage.getItem("theme");
  if (theme === "dark") setTheme(true);
})();

// --- Autocomplete Search ---
const searchBar = document.getElementById("search-bar");
const autocompleteList = document.getElementById("autocomplete-list");
let autocompleteTimeout;
searchBar.addEventListener("input", function () {
  clearTimeout(autocompleteTimeout);
  const q = this.value.trim();
  if (!q) return autocompleteList.classList.add("hidden");
  autocompleteTimeout = setTimeout(() => {
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        autocompleteList.innerHTML = "";
        data.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = `${item.symbol} - ${item.name}`;
          li.className =
            "px-3 py-2 hover:bg-blue-100 dark:hover:bg-gray-700 hover:brightness-110 dark:hover:brightness-125 cursor-pointer rounded transition-all";
          li.onclick = () => selectStock(item.symbol);
          autocompleteList.appendChild(li);
        });
        autocompleteList.classList.toggle("hidden", data.length === 0);
      });
  }, 200);
});
document.addEventListener("click", (e) => {
  if (!autocompleteList.contains(e.target) && e.target !== searchBar) {
    autocompleteList.classList.add("hidden");
  }
});

// --- Stock Data Fetch & UI Update ---
let currentSymbol = "AAPL";
let currentRange = "1mo";
function selectStock(symbol) {
  currentSymbol = symbol;
  searchBar.value = symbol;
  autocompleteList.classList.add("hidden");
  updateAll();
}

function updateAll() {
  fetchInfo();
  fetchPrice();
  fetchHistory();
  fetchNews();
  updateWatchlistUI();
}

function fetchInfo() {
  fetch(`/api/info?symbol=${currentSymbol}`)
    .then((r) => r.json())
    .then((data) => {
      document.getElementById("company-name").textContent = data.name || "";
      document.getElementById("company-sector").textContent = data.sector || "";
      document.getElementById("stock-ticker").textContent = data.symbol || "";
      document.getElementById("stock-currency").textContent =
        data.currency || "";
    });
}
function fetchPrice() {
  fetch(`/api/price?symbol=${currentSymbol}`)
    .then((r) => r.json())
    .then((data) => {
      document.getElementById("stock-price").textContent = data.price ?? "-";
      document.getElementById("stock-change").textContent = data.change
        ? `${data.change} (${data.percent_change}%)`
        : "";
      document.getElementById("stock-change").className =
        data.change > 0
          ? "text-green-600"
          : data.change < 0
          ? "text-red-600"
          : "";
    });
}
let chart;
function fetchHistory() {
  fetch(`/api/history?symbol=${currentSymbol}&range=${currentRange}`)
    .then((r) => r.json())
    .then((data) => {
      const ctx = document.getElementById("stock-chart").getContext("2d");
      if (chart) chart.destroy();
      chart = new Chart(ctx, {
        type: "line",
        data: {
          labels: data.dates,
          datasets: [
            {
              label: "Close",
              data: data.prices,
              borderColor: "rgba(99,102,241,1)",
              backgroundColor: "rgba(99,102,241,0.1)",
              tension: 0.3,
              pointRadius: 0,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { x: { display: false }, y: { display: true } },
        },
      });
    });
}
// Filter buttons
Array.from(document.getElementsByClassName("filter-btn")).forEach((btn) => {
  btn.onclick = function () {
    currentRange = this.dataset.range;
    fetchHistory();
  };
});

// --- Real-time Price Updates ---
setInterval(fetchPrice, 5000);

// --- Watchlist (localStorage) ---
function getWatchlist() {
  return JSON.parse(localStorage.getItem("watchlist") || "[]");
}
function setWatchlist(list) {
  localStorage.setItem("watchlist", JSON.stringify(list));
}
function updateWatchlistUI() {
  const list = getWatchlist();
  const ul = document.getElementById("watchlist");
  ul.innerHTML = "";
  list.forEach((symbol) => {
    const li = document.createElement("li");
    li.className =
      "flex justify-between items-center px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-gray-700 hover:brightness-110 dark:hover:brightness-125 cursor-pointer transition-all";
    li.textContent = symbol;
    li.onclick = () => selectStock(symbol);
    const del = document.createElement("button");
    del.innerHTML = '<i data-feather="x"></i>';
    del.onclick = (e) => {
      e.stopPropagation();
      removeFromWatchlist(symbol);
    };
    li.appendChild(del);
    ul.appendChild(li);
  });
  feather.replace();
}
function addToWatchlist(symbol) {
  let list = getWatchlist();
  if (!list.includes(symbol)) {
    list.push(symbol);
    setWatchlist(list);
    updateWatchlistUI();
  }
}
function removeFromWatchlist(symbol) {
  let list = getWatchlist().filter((s) => s !== symbol);
  setWatchlist(list);
  updateWatchlistUI();
}
document.getElementById("add-watchlist").onclick = () =>
  addToWatchlist(currentSymbol);

// --- Top Gainers/Losers ---
function fetchMovers(type) {
  fetch(`/api/gainers-losers?type=${type}`)
    .then((r) => r.json())
    .then((data) => {
      const ul = document.getElementById("movers-list");
      ul.innerHTML = "";
      data.forEach((item) => {
        const li = document.createElement("li");
        li.className =
          "flex justify-between items-center px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-gray-700 cursor-pointer";
        li.innerHTML = `<span>${item.symbol}</span><span class='${
          item.change > 0 ? "text-green-600" : "text-red-600"
        }'>${item.change > 0 ? "+" : ""}${item.percent_change}%</span>`;
        li.onclick = () => selectStock(item.symbol);
        ul.appendChild(li);
      });
    });
}
document.getElementById("gainers-btn").onclick = () => fetchMovers("gainers");
document.getElementById("losers-btn").onclick = () => fetchMovers("losers");

// --- News Headlines ---
function fetchNews() {
  fetch(`/api/news?symbol=${currentSymbol}`)
    .then((r) => r.json())
    .then((data) => {
      const ul = document.getElementById("news-list");
      ul.innerHTML = "";
      data.forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="${item.url}" target="_blank" class="hover:underline">${item.title}</a><div class="text-xs text-gray-500 dark:text-gray-400">${item.source} • ${item.time}</div>`;
        ul.appendChild(li);
      });
    });
}

// --- Currency Converter ---
function fetchCurrencies() {
  fetch("/api/convert?currencies=1")
    .then((r) => r.json())
    .then((data) => {
      const from = document.getElementById("currency-from");
      const to = document.getElementById("currency-to");
      from.innerHTML = "";
      to.innerHTML = "";
      data.forEach((cur) => {
        from.innerHTML += `<option value="${cur}">${cur}</option>`;
        to.innerHTML += `<option value="${cur}">${cur}</option>`;
      });
      from.value = "USD";
      to.value = "INR";
    });
}
document.getElementById("convert-btn").onclick = function () {
  const amt = document.getElementById("currency-amount").value;
  const from = document.getElementById("currency-from").value;
  const to = document.getElementById("currency-to").value;
  fetch(`/api/convert?from=${from}&to=${to}&amount=${amt}`)
    .then((r) => r.json())
    .then((data) => {
      document.getElementById("currency-result").textContent = data.result
        ? `${amt} ${from} = ${data.result} ${to}`
        : "Conversion failed";
    });
};

// --- Initial Load ---
window.onload = function () {
  updateAll();
  fetchMovers("gainers");
  fetchCurrencies();
};
