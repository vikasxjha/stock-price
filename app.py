from flask import Flask, render_template, request
import yfinance as yf
from tabulate import tabulate

app = Flask(__name__)

# Installation instructions:
# pip install yfinance tabulate flask

def fetch_prices(symbols):
    results = []
    known_suffixes = ['.NS', '.BO', '.AX', '.L', '.TO', '.V', '.SI', '.HK', '.KS', '.KQ', '.TW', '.SS', '.SZ', '.F', '.DE', '.PA', '.MI', '.ST', '.HE', '.CO', '.OL', '.MC', '.SW', '.PR', '.IR', '.TA', '.VI', '.SA', '.ME', '.IS', '.BK', '.TWO', '.T', '.NZ', '.SG', '.JK', '.B']
    for symbol in symbols:
        original_symbol = symbol.strip().upper()
        # Use as-is if symbol has a known suffix
        if any(original_symbol.endswith(suf) for suf in known_suffixes):
            symbol_to_fetch = original_symbol
            try:
                ticker = yf.Ticker(symbol_to_fetch)
                data = ticker.history(period="1d")
                if data.empty:
                    raise ValueError("No data found")
                price = data['Close'].iloc[-1]
                currency = ticker.info.get('currency', 'N/A')
                results.append({'Symbol': original_symbol, 'Price': price, 'Currency': currency})
                continue
            except Exception:
                results.append({'Symbol': original_symbol, 'Price': 'N/A', 'Currency': 'N/A'})
                continue
        # Try as US stock first
        try:
            ticker = yf.Ticker(original_symbol)
            data = ticker.history(period="1d")
            if not data.empty:
                price = data['Close'].iloc[-1]
                currency = ticker.info.get('currency', 'N/A')
                results.append({'Symbol': original_symbol, 'Price': price, 'Currency': currency})
                continue
        except Exception:
            pass
        # Fallback to Indian stock (.NS)
        try:
            symbol_ns = original_symbol + '.NS'
            ticker = yf.Ticker(symbol_ns)
            data = ticker.history(period="1d")
            if not data.empty:
                price = data['Close'].iloc[-1]
                currency = ticker.info.get('currency', 'N/A')
                results.append({'Symbol': original_symbol, 'Price': price, 'Currency': currency})
                continue
        except Exception:
            pass
        # If all fail
        results.append({'Symbol': original_symbol, 'Price': 'N/A', 'Currency': 'N/A'})
    return results

@app.route('/', methods=['GET', 'POST'])
def index():
    table_html = None
    error = None
    if request.method == 'POST':
        symbols = request.form.get('symbols', '')
        if not symbols.strip():
            error = "Please enter at least one stock symbol."
        else:
            symbol_list = [s.strip() for s in symbols.split(',') if s.strip()]
            results = fetch_prices(symbol_list)
            table_html = tabulate(results, headers="keys", tablefmt="html", floatfmt=".2f")
    return render_template('index.html', table_html=table_html, error=error)

if __name__ == '__main__':
    app.run(debug=True)
