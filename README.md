# 📌 API de Sistema de Chamados (Tickets)

Projeto desenvolvido para fins didáticos nas aulas de JavaScript (Node.js), utilizando **MySQL** como banco de dados.

O objetivo é ensinar:

- Estruturação de API REST
- Integração com banco relacional (MySQL)
- Autenticação
- Relacionamentos entre tabelas
- Boas práticas básicas de backend

---

# 🎯 Objetivo do Projeto

Construir uma API para um sistema simples de chamados (tickets), contendo:

- Cadastro de usuários
- Abertura de chamados
- Atribuição de atendentes
- Envio de mensagens dentro do chamado
- Controle de status

O sistema trabalha com três perfis:

- **CLIENTE**
- **ATENDENTE**
- **ADMINISTRADOR**

---

# 🔄 Fluxo do Sistema

### 📍 Cliente

- Criar conta
- Abrir chamado
- Enviar mensagens no chamado
- Visualizar status

### 📍 Atendente

- Visualizar chamados abertos
- Assumir chamado
- Alterar status
- Enviar mensagens

### 📍 Administrador

- Gerenciar usuários
- Visualizar todos os chamados
- Controlar o sistema

---

# 📚 Conceitos Trabalhados em Aula

Este projeto permite ensinar:

- API REST (GET, POST, PATCH, DELETE)
- JSON
- Middleware
- Autenticação com JWT
- Criptografia de senha (bcrypt)
- Relacionamento 1:N
- Chaves estrangeiras
- Índices
- Tratamento de erros
- Códigos HTTP

---

# 🚀 Tecnologias Utilizadas

- Node.js
- Express
- MySQL 8+
- Bcrypt
- JWT (quando implementado)

---

# 📦 Próximas Etapas do Projeto

- [ ] Criar estrutura Node.js
- [ ] Implementar conexão com MySQL
- [ ] Criar rota de cadastro
- [ ] Criar login com JWT
- [ ] Criar CRUD de chamados
- [ ] Criar CRUD de mensagens
- [ ] Implementar controle de permissão por perfil

---

# 📖 Observação Didática

Este projeto foi pensado para:

- Ser simples o suficiente para iniciantes
- Mas estruturado como um sistema real
- Demonstrar boas práticas desde o início

---

# 🧑‍🏫 Uso em Sala de Aula

O professor pode utilizar este projeto para:

- Explicar modelagem de banco
- Demonstrar requisições via Postman
- Ensinar organização de pastas
- Trabalhar autenticação
- Introduzir conceitos de segurança

---

# 📌 Licença

Projeto de uso educacional.
