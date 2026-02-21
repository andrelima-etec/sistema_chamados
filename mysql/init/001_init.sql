-- =====================================================
-- SISTEMA DE CHAMADOS - ESTRUTURA COMPLETA
-- MySQL 8+
-- =====================================================

-- -----------------------------------------------------
-- CRIAÇÃO DO BANCO
-- -----------------------------------------------------

CREATE DATABASE IF NOT EXISTS sistema_chamados
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE sistema_chamados;

-- -----------------------------------------------------
-- TABELA: usuarios
-- -----------------------------------------------------

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    role ENUM('CLIENTE','ATENDENTE','ADMINISTRADOR') NOT NULL DEFAULT 'CLIENTE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_usuarios_email UNIQUE (email)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- TABELA: chamados
-- -----------------------------------------------------

CREATE TABLE chamados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status ENUM('A','E','F') NOT NULL DEFAULT 'A',
    assunto VARCHAR(255) NOT NULL,
    cliente_id INT NOT NULL,
    atendente_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_chamados_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_chamados_atendente
        FOREIGN KEY (atendente_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- TABELA: mensagens_chamado
-- -----------------------------------------------------

CREATE TABLE mensagens_chamado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chamado_id INT NOT NULL,
    mensagem TEXT NOT NULL,
    usuario_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mensagens_chamado
        FOREIGN KEY (chamado_id)
        REFERENCES chamados(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_mensagens_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- ÍNDICES PARA PERFORMANCE
-- -----------------------------------------------------

CREATE INDEX idx_chamados_status ON chamados(status);
CREATE INDEX idx_chamados_cliente ON chamados(cliente_id);
CREATE INDEX idx_chamados_atendente ON chamados(atendente_id);
CREATE INDEX idx_mensagens_chamado ON mensagens_chamado(chamado_id);

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================