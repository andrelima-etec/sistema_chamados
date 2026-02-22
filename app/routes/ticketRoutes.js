const express = require('express');
const auth = require('../middleware/auth');
const ticketController = require('../controllers/ticketController');
const messageController = require('../controllers/messageController');

const router = express.Router();

// Chamados
router.post('/chamados', auth, ticketController.createTicket);
router.get('/chamados', auth, ticketController.listTickets);
router.get('/chamados/:id', auth, ticketController.getTicketById);
router.patch('/chamados/:id/assumir', auth, ticketController.assumeTicket);
router.patch('/chamados/:id/status', auth, ticketController.updateStatus);

// Mensagens do chamado
router.post('/chamados/:id/mensagens', auth, messageController.addMessage);

module.exports = router;