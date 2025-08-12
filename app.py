from flask import Flask, render_template, request, jsonify

import yfinance as yf
from tabulate import tabulate
import requests
import threading
import time

app = Flask(__name__)

# Installation instructions:
# pip install yfinance tabulate flask


# --- API Endpoints ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/price')
def api_price():
    symbol = request.args.get('symbol', 'AAPL').upper()
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period="1d")
        price = float(data['Close'].iloc[-1]) if not data.empty else None
        prev = float(data['Close'].iloc[-2]) if len(data) > 1 else price
        change = round(price - prev, 2) if price and prev else 0
        percent = round((change / prev) * 100, 2) if prev else 0
        return jsonify({
            'price': price,
            'change': change,
            'percent_change': percent
        })
    except Exception:
        return jsonify({'price': None, 'change': 0, 'percent_change': 0})

@app.route('/api/history')
def api_history():
    symbol = request.args.get('symbol', 'AAPL').upper()
    range_ = request.args.get('range', '1mo')
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=range_)
        dates = [d.strftime('%Y-%m-%d') for d in data.index]
        prices = [round(float(p), 2) for p in data['Close']]
        return jsonify({'dates': dates, 'prices': prices})
    except Exception:
        return jsonify({'dates': [], 'prices': []})

@app.route('/api/info')
def api_info():
    symbol = request.args.get('symbol', 'AAPL').upper()
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        return jsonify({
            'symbol': symbol,
            'name': info.get('shortName', ''),
            'sector': info.get('sector', ''),
            'marketCap': info.get('marketCap', ''),
            'currency': info.get('currency', '')
        })
    except Exception:
        return jsonify({'symbol': symbol, 'name': '', 'sector': '', 'marketCap': '', 'currency': ''})

@app.route('/api/search')
def api_search():
    q = request.args.get('q', '').upper()
    # Simple static list for demo; replace with a real autocomplete source or cache
    static = [
        {'symbol': 'AAPL', 'name': 'Apple Inc.'},
        {'symbol': 'MSFT', 'name': 'Microsoft Corp.'},
        {'symbol': 'TSLA', 'name': 'Tesla Inc.'},
        {'symbol': 'GOOGL', 'name': 'Alphabet Inc.'},
        {'symbol': 'AMZN', 'name': 'Amazon.com Inc.'},
        {'symbol': 'INFY.NS', 'name': 'Infosys Ltd.'},
        {'symbol': 'TCS.NS', 'name': 'Tata Consultancy Services'},
        {'symbol': 'RELIANCE.NS', 'name': 'Reliance Industries'},
        {'symbol': 'HDFCBANK.NS', 'name': 'HDFC Bank'},
        {'symbol': 'ITC.NS', 'name': 'ITC Ltd.'},
    ]
    results = [s for s in static if q in s['symbol'] or q in s['name'].upper()]
    return jsonify(results[:8])

@app.route('/api/gainers-losers')
def api_gainers_losers():
    type_ = request.args.get('type', 'gainers')
    # For demo, use static data; in production, use a real API or scrape Yahoo Finance
    demo = {
        'gainers': [
            {'symbol': 'TSLA', 'change': 12.5, 'percent_change': 4.2},
            {'symbol': 'AAPL', 'change': 5.1, 'percent_change': 2.1},
            {'symbol': 'TCS.NS', 'change': 40, 'percent_change': 3.5},
        ],
        'losers': [
            {'symbol': 'NFLX', 'change': -8.2, 'percent_change': -3.1},
            {'symbol': 'META', 'change': -4.7, 'percent_change': -2.2},
            {'symbol': 'ITC.NS', 'change': -10, 'percent_change': -2.8},
        ]
    }
    return jsonify(demo.get(type_, []))

@app.route('/api/news')
def api_news():
    symbol = request.args.get('symbol', 'AAPL').upper()
    # For demo, use static news; in production, use NewsAPI or Yahoo Finance News
    demo = [
        {'title': f'{symbol} hits new high', 'url': 'https://finance.yahoo.com', 'source': 'Yahoo Finance', 'time': '1h ago'},
        {'title': f'Analyst upgrades {symbol}', 'url': 'https://finance.yahoo.com', 'source': 'Yahoo Finance', 'time': '2h ago'},
        {'title': f'{symbol} quarterly results beat estimates', 'url': 'https://finance.yahoo.com', 'source': 'Yahoo Finance', 'time': '3h ago'},
    ]
    return jsonify(demo)

@app.route('/api/convert')
def api_convert():
    if 'currencies' in request.args:
        # Return a static list of major currencies
        return jsonify(['USD', 'INR', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD'])
    from_cur = request.args.get('from', 'USD')
    to_cur = request.args.get('to', 'INR')
    amount = float(request.args.get('amount', 1))
    try:
        # Use exchangerate.host for free conversion
        url = f'https://api.exchangerate.host/convert?from={from_cur}&to={to_cur}&amount={amount}'
        resp = requests.get(url, timeout=5)
        data = resp.json()
        return jsonify({'result': round(data.get('result', 0), 2)})
    except Exception:
        return jsonify({'result': None})



if __name__ == '__main__':
    app.run(debug=True)
