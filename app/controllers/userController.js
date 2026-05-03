const bcrypt = require('bcrypt');
const pool = require('../database/db');
const supabase = require('../lib/supabase');

async function createUser(req, res) {
  try {
    const { nome, email, senha, role } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'nome, email e senha são obrigatórios' });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const nomeNorm = String(nome).trim();

    if (!emailNorm.includes('@') || emailNorm.length < 5) {
      return res.status(400).json({ error: 'email inválido' });
    }

    if (String(senha).length < 6) {
      return res.status(400).json({ error: 'senha deve ter pelo menos 6 caracteres' });
    }

    const allowedRoles = ['CLIENTE', 'ATENDENTE', 'ADMINISTRADOR'];
    const roleFinal = allowedRoles.includes(role) ? role : 'CLIENTE';

    supabase.from('usuarios')
      .select('id')
      .eq('email', emailNorm)
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          return res.status(500).json({ error: 'erro interno', detail: error.message });
        }

        if (data.length > 0) {
          return res.status(409).json({ error: 'email já cadastrado' });
        }

        bcrypt.hash(String(senha), 10)
          .then(senhaHash => {
            supabase.from('usuarios')
              .insert({ nome: nomeNorm, email: emailNorm, senha_hash: senhaHash, role: roleFinal })
              .select('id, nome, email, role')
              .single()
              .then(({ data, error }) => {
                if (error) {
                  return res.status(500).json({ error: 'erro interno', detail: error.message });
                }

                return res.status(201).json({
                  id: data.id,
                  nome: data.nome,
                  email: data.email,
                  role: data.role,
                });
              })
              .catch(err => {
                return res.status(500).json({ error: 'erro interno', detail: err.message });
              });
          })
          .catch(err => {
            return res.status(500).json({ error: 'erro interno', detail: err.message });
          });
      })
      .catch(err => {
        return res.status(500).json({ error: 'erro interno', detail: err.message });
      });

    // const [exist] = await pool.query('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [emailNorm]);
    // if (exist.length > 0) {
    //   return res.status(409).json({ error: 'email já cadastrado' });
    // }

    // const senhaHash = await bcrypt.hash(String(senha), 10);

    // const [result] = await pool.query(
    //   'INSERT INTO usuarios (nome, email, senha_hash, role) VALUES (?, ?, ?, ?)',
    //   [nomeNorm, emailNorm, senhaHash, roleFinal]
    // );

    // return res.status(201).json({
    //   id: result.insertId,
    //   nome: nomeNorm,
    //   email: emailNorm,
    //   role: roleFinal,
    // });
  } catch (err) {
    return res.status(500).json({ error: 'erro interno', detail: err.message });
  }
}

async function getMe(req, res) {
  try {
    supabase.from('usuarios')
      .select('id, nome, email, role, created_at, updated_at')
      .eq('id', req.user.id)
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          return res.status(500).json({ error: 'erro interno', detail: error.message });
        }

        if (data.length === 0) {
          return res.status(404).json({ error: 'usuário não encontrado' });
        }

        return res.json(data[0]);
      })
      .catch(err => {
        return res.status(500).json({ error: 'erro interno', detail: err.message });
      });

    // const [rows] = await pool.query(
    //   'SELECT id, nome, email, role, created_at, updated_at FROM usuarios WHERE id = ? LIMIT 1',
    //   [req.user.id]
    // );

    // if (rows.length === 0) {
    //   return res.status(404).json({ error: 'usuário não encontrado' });
    // }

    // return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'erro interno', detail: err.message });
  }
}

module.exports = {
  createUser,
  getMe,
};