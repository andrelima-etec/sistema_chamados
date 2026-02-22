require('dotenv').config();

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const pool = require('./db');
const auth = require('./middleware/auth');

const app = express();
app.use(express.json());

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API rodando' });
});

// Teste rápido de banco
app.get('/db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ db: 'ok', result: rows[0] });
  } catch (err) {
    res.status(500).json({ db: 'erro', detail: err.message });
  }
});

app.post('/usuarios', async (req, res) => {
  try {
    const { nome, email, senha, role } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'nome, email e senha são obrigatórios' });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const nomeNorm = String(nome).trim();

    // validação simples de email (didático)
    if (!emailNorm.includes('@') || emailNorm.length < 5) {
      return res.status(400).json({ error: 'email inválido' });
    }

    // regra simples de senha (didática)
    if (String(senha).length < 6) {
      return res.status(400).json({ error: 'senha deve ter pelo menos 6 caracteres' });
    }

    // role opcional
    const roleFinal = role && ['CLIENTE', 'ATENDENTE', 'ADMINISTRADOR'].includes(role)
      ? role
      : 'CLIENTE';

    // verifica email duplicado
    const [exist] = await pool.query('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [emailNorm]);
    if (exist.length > 0) {
      return res.status(409).json({ error: 'email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(String(senha), 10);

    const [result] = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, role) VALUES (?, ?, ?, ?)`,
      [nomeNorm, emailNorm, senhaHash, roleFinal]
    );

    return res.status(201).json({
      id: result.insertId,
      nome: nomeNorm,
      email: emailNorm,
      role: roleFinal,
    });
  } catch (err) {
    return res.status(500).json({ error: 'erro interno', detail: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'email e senha são obrigatórios' });
    }

    const emailNorm = String(email).trim().toLowerCase();

    const [rows] = await pool.query(
      `SELECT id, email, senha_hash, role FROM usuarios WHERE email = ? LIMIT 1`,
      [emailNorm]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'credenciais inválidas' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(String(senha), user.senha_hash);

    if (!ok) {
      return res.status(401).json({ error: 'credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: 'erro interno', detail: err.message });
  }
});

app.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nome, email, role, created_at, updated_at FROM usuarios WHERE id = ? LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'usuário não encontrado' });
    }

    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'erro interno', detail: err.message });
  }
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
