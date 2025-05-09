// server.js
const express        = require('express');
const yahooFinance = require('yahoo-finance2').default;
const cors           = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/price/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  try {
    // quote() trae datos de mercado; .regularMarketPrice es el precio actual
    const quote = await yahooFinance.quote(symbol);
    if (!quote || !quote.regularMarketPrice) {
      return res.status(404).json({ error: `No hay datos para ${symbol}` });
    }
    return res.json({ symbol, price: quote.regularMarketPrice });
  } catch (err) {
    console.error('YF‑ERR', err);
    return res.status(500).json({ error: 'falló consulta Yahoo Finance' });
  }
});

// Nuevo endpoint para obtener múltiples precios a la vez
app.get('/api/prices', async (req, res) => {
  const symbols = req.query.symbols;
  
  if (!symbols) {
    return res.status(400).json({ error: 'Se requiere el parámetro "symbols"' });
  }
  
  const symbolsList = symbols.split(',').map(s => s.trim().toUpperCase());
  
  try {
    const results = {};
    // Usamos Promise.all para hacer todas las consultas en paralelo
    await Promise.all(
      symbolsList.map(async (symbol) => {
        try {
          const quote = await yahooFinance.quote(symbol);
          if (quote && quote.regularMarketPrice) {
            results[symbol] = {
              price: quote.regularMarketPrice,
              change: quote.regularMarketChangePercent,
              name: quote.shortName || quote.longName || symbol
            };
          }
        } catch (err) {
          console.error(`Error obteniendo datos para ${symbol}:`, err);
        }
      })
    );
    
    return res.json(results);
  } catch (err) {
    console.error('Error general:', err);
    return res.status(500).json({ error: 'Error consultando Yahoo Finance' });
  }
});

app.listen(PORT, ()=> console.log(`Server en http://localhost:${PORT}`));
