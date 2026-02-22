const pool = require('../database/db');

function isStaff(role) {
  return role === 'ATENDENTE' || role === 'ADMINISTRADOR';
}

async function createTicket(req, res) {
  let conn;
  try {
    const { assunto, descricao } = req.body;

    // regra didática (você pode deixar ADMIN criar para testes)
    if (req.user.role !== 'CLIENTE' && req.user.role !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Apenas CLIENTE pode abrir chamado (ou ADMINISTRADOR para testes).' });
    }

    if (!assunto || String(assunto).trim().length < 3) {
      return res.status(400).json({ error: 'assunto é obrigatório (mínimo 3 caracteres)' });
    }

    // agora exigimos descrição para virar 1ª mensagem
    if (!descricao || String(descricao).trim().length < 3) {
      return res.status(400).json({ error: 'descricao é obrigatória (mínimo 3 caracteres)' });
    }

    const assuntoNorm = String(assunto).trim();
    const descNorm = String(descricao).trim();

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1) cria o chamado
    const [resultTicket] = await conn.query(
      'INSERT INTO chamados (status, assunto, cliente_id, atendente_id) VALUES (?, ?, ?, ?)',
      ['A', assuntoNorm, req.user.id, null]
    );

    const ticketId = resultTicket.insertId;

    // 2) cria a 1ª mensagem (descrição)
    const [resultMsg] = await conn.query(
      'INSERT INTO mensagens_chamado (chamado_id, mensagem, usuario_id) VALUES (?, ?, ?)',
      [ticketId, descNorm, req.user.id]
    );

    await conn.commit();

    return res.status(201).json({
      id: ticketId,
      status: 'A',
      assunto: assuntoNorm,
      cliente_id: req.user.id,
      atendente_id: null,
      mensagem_inicial_id: resultMsg.insertId
    });
  } catch (err) {
    if (conn) await conn.rollback();
    return res.status(500).json({ error: 'erro interno', detail: err.message });
  } finally {
    if (conn) conn.release();
  }
}

async function listTickets(req, res) {
  try {
    const { status } = req.query; // opcional: A/E/F

    const params = [];
    let sql = `
      SELECT c.id, c.status, c.assunto, c.cliente_id, c.atendente_id, c.created_at, c.updated_at
      FROM chamados c
    `;

    const where = [];

    if (status && ['A', 'E', 'F'].includes(status)) {
      where.push('c.status = ?');
      params.push(status);
    }

    if (!isStaff(req.user.role)) {
      // cliente: apenas seus chamados
      where.push('c.cliente_id = ?');
      params.push(req.user.id);
    }

    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
    sql += ' ORDER BY c.updated_at DESC';

    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: 'erro interno', detail: err.message });
  }
}

async function getTicketById(req, res) {
  try {
    const ticketId = Number(req.params.id);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({ error: 'id inválido' });
    }

    const [tickets] = await pool.query(
      'SELECT id, status, assunto, cliente_id, atendente_id, created_at, updated_at FROM chamados WHERE id = ? LIMIT 1',
      [ticketId]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'chamado não encontrado' });
    }

    const ticket = tickets[0];

    // autorização
    const isOwner = ticket.cliente_id === req.user.id;
    const canSee = isStaff(req.user.role) || isOwner;

    if (!canSee) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const [msgs] = await pool.query(
      `
      SELECT m.id, m.chamado_id, m.mensagem, m.usuario_id, m.created_at,
             u.nome AS usuario_nome, u.role AS usuario_role
      FROM mensagens_chamado m
      JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.chamado_id = ?
      ORDER BY m.created_at ASC
      `,
      [ticketId]
    );

    return res.json({ ticket, mensagens: msgs });
  } catch (err) {
    return res.status(500).json({ error: 'erro interno', detail: err.message });
  }
}

async function assumeTicket(req, res) {
  try {
    if (!isStaff(req.user.role)) {
      return res.status(403).json({ error: 'Apenas ATENDENTE/ADMINISTRADOR pode assumir chamado' });
    }

    const ticketId = Number(req.params.id);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({ error: 'id inválido' });
    }

    const [tickets] = await pool.query(
      'SELECT id, status, atendente_id FROM chamados WHERE id = ? LIMIT 1',
      [ticketId]
    );
    if (tickets.length === 0) return res.status(404).json({ error: 'chamado não encontrado' });

    const ticket = tickets[0];

    if (ticket.status === 'F') {
      return res.status(400).json({ error: 'chamado fechado não pode ser assumido' });
    }

    // assume se não tiver atendente
    if (ticket.atendente_id && req.user.role !== 'ADMINISTRADOR') {
      return res.status(400).json({ error: 'chamado já possui atendente' });
    }

    await pool.query(
      'UPDATE chamados SET atendente_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.user.id, 'E', ticketId]
    );

    return res.json({ ok: true, id: ticketId, atendente_id: req.user.id, status: 'E' });
  } catch (err) {
    return res.status(500).json({ error: 'erro interno', detail: err.message });
  }
}

async function updateStatus(req, res) {
  try {
    const ticketId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({ error: 'id inválido' });
    }

    if (!status || !['A', 'E', 'F'].includes(status)) {
      return res.status(400).json({ error: "status inválido. Use 'A', 'E' ou 'F'" });
    }

    const [tickets] = await pool.query(
      'SELECT id, cliente_id, atendente_id, status FROM chamados WHERE id = ? LIMIT 1',
      [ticketId]
    );
    if (tickets.length === 0) return res.status(404).json({ error: 'chamado não encontrado' });

    const ticket = tickets[0];
    const isOwner = ticket.cliente_id === req.user.id;

    // regra simples:
    // - ATENDENTE/ADMIN pode alterar para qualquer status
    // - CLIENTE só pode fechar (F) o próprio chamado
    if (isStaff(req.user.role)) {
      // ok
    } else {
      if (!isOwner) return res.status(403).json({ error: 'Acesso negado' });
      if (status !== 'F') return res.status(403).json({ error: 'CLIENTE só pode fechar (F) o próprio chamado' });
    }

    await pool.query(
      'UPDATE chamados SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, ticketId]
    );

    return res.json({ ok: true, id: ticketId, status });
  } catch (err) {
    return res.status(500).json({ error: 'erro interno', detail: err.message });
  }
}

module.exports = {
  createTicket,
  listTickets,
  getTicketById,
  assumeTicket,
  updateStatus,
};