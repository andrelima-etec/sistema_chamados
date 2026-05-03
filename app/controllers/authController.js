const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const pool = require('../database/db');

const supabase = require('../lib/supabase');

async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'email e senha são obrigatórios' });
    }

    const emailNorm = String(email).trim().toLowerCase();

    supabase.from('usuarios')
      .select('id, email, senha_hash, role')
      .eq('email', emailNorm)
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          return res.status(500).json({ error: 'erro interno', detail: error.message });
        }

        if (data.length === 0) {
          return res.status(401).json({ error: 'credenciais inválidas' });
        }

        const user = data[0];
        bcrypt.compare(String(senha), user.senha_hash)
          .then(ok => {
            if (!ok) {
              return res.status(401).json({ error: 'credenciais inválidas' });
            }

            const token = jwt.sign(
              { id: user.id, email: user.email, role: user.role },
              process.env.JWT_SECRET,
              { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
            );

            return res.json({ token });
          })
          .catch(err => {
            return res.status(500).json({ error: 'erro interno', detail: err.message });
          });
      })
      .catch(err => {
        return res.status(500).json({ error: 'erro interno', detail: err.message });
      });

    // const [rows] = await pool.query(
    //   'SELECT id, email, senha_hash, role FROM usuarios WHERE email = ? LIMIT 1',
    //   [emailNorm]
    // );

    // if (rows.length === 0) {
    //   return res.status(401).json({ error: 'credenciais inválidas' });
    // }

    // const user = rows[0];
    // const ok = await bcrypt.compare(String(senha), user.senha_hash);

    // if (!ok) {
    //   return res.status(401).json({ error: 'credenciais inválidas' });
    // }

    // const token = jwt.sign(
    //   { id: user.id, email: user.email, role: user.role },
    //   process.env.JWT_SECRET,
    //   { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    // );

    // return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: 'erro interno', detail: err.message });
  }
}

module.exports = {
  login,
};