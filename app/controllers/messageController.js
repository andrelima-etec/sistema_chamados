const pool = require('../database/db');

function isStaff(role) {
  return role === 'ATENDENTE' || role === 'ADMINISTRADOR';
}

async function addMessage(req, res) {
  try {
    const ticketId = Number(req.params.id);
    const { mensagem } = req.body;

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({ error: 'id inválido' });
    }

    if (!mensagem || String(mensagem).trim().length < 1) {
      return res.status(400).json({ error: 'mensagem é obrigatória' });
    }

    const msgNorm = String(mensagem).trim();

    const [tickets] = await pool.query(
      'SELECT id, status, cliente_id FROM chamados WHERE id = ? LIMIT 1',
      [ticketId]
    );
    if (tickets.length === 0) return res.status(404).json({ error: 'chamado não encontrado' });

    const ticket = tickets[0];

    if (ticket.status === 'F') {
      return res.status(400).json({ error: 'chamado fechado não aceita novas mensagens' });
    }

    const isOwner = ticket.cliente_id === req.user.id;
    if (!isStaff(req.user.role) && !isOwner) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const [result] = await pool.query(
      'INSERT INTO mensagens_chamado (chamado_id, mensagem, usuario_id) VALUES (?, ?, ?)',
      [ticketId, msgNorm, req.user.id]
    );

    // Atualiza updated_at do chamado (pra lista ordenar por atividade)
    await pool.query(
      'UPDATE chamados SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [ticketId]
    );

    return res.status(201).json({
      id: result.insertId,
      chamado_id: ticketId,
      mensagem: msgNorm,
      usuario_id: req.user.id
    });
  } catch (err) {
    return res.status(500).json({ error: 'erro interno', detail: err.message });
  }
}

module.exports = { addMessage };