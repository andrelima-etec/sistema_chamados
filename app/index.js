require('dotenv').config();

const express = require('express');
const pool = require('./database/db');

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();
app.use(express.json());

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API rodando' });
});

// Teste do banco
app.get('/db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ db: 'ok', result: rows[0] });
  } catch (err) {
    res.status(500).json({ db: 'erro', detail: err.message });
  }
});

// Rotas
app.use(authRoutes);
app.use(userRoutes);
app.use(ticketRoutes);

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});