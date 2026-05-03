// const pool = require('../database/db');
const supabase = require('../lib/supabase');

function isStaff(role) {
  return role === 'ATENDENTE' || role === 'ADMINISTRADOR';
}

async function addMessage(req, res) {
  let conn;
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

    const { data: ticket, error } = await supabase.from('chamados')
      .select('id, status, cliente_id, atendente_id')
      .eq('id', ticketId)
      .limit(1)
      .single();

    if (error) {
      return res.status(500).json({ error: 'erro interno', detail: error.message });
    }

    if (!ticket) {
      return res.status(404).json({ error: 'chamado não encontrado' });
    }

    if (ticket.status === 'F') {
      return res.status(400).json({ error: 'chamado fechado não aceita novas mensagens' });
    }
      const owner = ticket.cliente_id === req.user.id;
    if (!isStaff(req.user.role) && !owner) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // conn = await pool.getConnection();
    // await conn.beginTransaction();

    // // trava a linha do chamado para evitar corrida em "assumir"
    // const [tickets] = await conn.query(
    //   'SELECT id, status, cliente_id, atendente_id FROM chamados WHERE id = ? FOR UPDATE',
    //   [ticketId]
    // );

    // if (tickets.length === 0) {
    //   await conn.rollback();
    //   return res.status(404).json({ error: 'chamado não encontrado' });
    // }

    // const ticket = tickets[0];

    // if (ticket.status === 'F') {
    //   await conn.rollback();
    //   return res.status(400).json({ error: 'chamado fechado não aceita novas mensagens' });
    // }

    // const owner = ticket.cliente_id === req.user.id;
    // if (!isStaff(req.user.role) && !owner) {
    //   await conn.rollback();
    //   return res.status(403).json({ error: 'Acesso negado' });
    // }

    // ✅ auto-assumir: se é staff e não tem atendente, assume e põe status E
    let assumed = false;
    if (isStaff(req.user.role) && !ticket.atendente_id) {
      supabase.from('chamados')
        .update({ atendente_id: req.user.id, status: 'E', updated_at: new Date() })
        .eq('id', ticketId)
        .then(({ error }) => {
          if (error) {
            console.error('Erro ao atualizar chamado:', error);
          }
        });

      // await conn.query(
      //   'UPDATE chamados SET atendente_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      //   [req.user.id, 'E', ticketId]
      // );
      assumed = true;
    } else {
      // só atualiza updated_at
      supabase.from('chamados')
        .update({ updated_at: new Date() })
        .eq('id', ticketId)
        .then(({ error }) => {
          if (error) {
            console.error('Erro ao atualizar chamado:', error);
          }
        });

      // await conn.query(
      //   'UPDATE chamados SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      //   [ticketId]
      // );
    }

    // cria mensagem
    supabase.from('mensagens_chamado')
      .insert({ chamado_id: ticketId, mensagem: msgNorm, usuario_id: req.user.id })
      .select('id, chamado_id, mensagem, usuario_id, created_at')
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Erro ao inserir mensagem:', error);
          return res.status(500).json({ error: 'erro interno', detail: error.message });
        }

        return res.status(201).json({
          id: data.id,
          chamado_id: data.chamado_id,
          mensagem: data.mensagem,
          usuario_id: data.usuario_id,
          created_at: data.created_at,
          auto_assumiu: assumed
        });
      })
      .catch(err => {
        console.error('Erro ao inserir mensagem:', err);
        return res.status(500).json({ error: 'erro interno', detail: err.message });
      });

    // const [result] = await conn.query(
    //   'INSERT INTO mensagens_chamado (chamado_id, mensagem, usuario_id) VALUES (?, ?, ?)',
    //   [ticketId, msgNorm, req.user.id]
    // );

    // await conn.commit();

    // return res.status(201).json({
    //   id: result.insertId,
    //   chamado_id: ticketId,
    //   mensagem: msgNorm,
    //   usuario_id: req.user.id,
    //   auto_assumiu: assumed
    // });
  } catch (err) {
    // if (conn) await conn.rollback();
    return res.status(500).json({ error: 'erro interno', detail: err.message });
  // } finally {
  //   if (conn) conn.release();
  }
}

module.exports = { addMessage };