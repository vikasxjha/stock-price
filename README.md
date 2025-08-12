# Stock Price Fetcher Web App

This project is a Python web application that allows users to input a comma-separated list of stock ticker symbols, fetches the latest closing prices for each using the yfinance library, and displays the results in a neat table using the tabulate library.

## Features

- Input: Comma-separated stock symbols (e.g., AAPL, TSLA, MSFT)
- Fetches latest closing price for each symbol
- Displays results in a clean table (Symbol, Price, Currency)
- Handles errors for invalid/unavailable symbols
- Clean, user-friendly UI

## Installation

1. **Create a virtual environment (optional but recommended):**
   ```sh
   python3 -m venv venv
   source venv/bin/activate
   ```
2. **Install required packages:**
   ```sh
   pip install yfinance tabulate flask
   ```

## Usage

1. Run the app:
   ```sh
   python app.py
   ```
2. Open your browser and go to `http://127.0.0.1:5000/`

---

- `yfinance` is used to fetch stock data.
- `tabulate` is used to format the table output.
- `flask` is used for the web interface.
