// db/migrate.js — Cria todas as tabelas automaticamente
// Executar com: npm run db:migrate
import { pool } from './connection.js';

const migrations = [
  // ── Usuários ──────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS usuarios (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    nome       VARCHAR(100)  NOT NULL,
    email      VARCHAR(150)  NOT NULL UNIQUE,
    senha_hash VARCHAR(255)  NOT NULL,
    criado_em  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── Eventos ───────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS eventos (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    titulo      VARCHAR(200) NOT NULL,
    descricao   TEXT,
    data_inicio DATE         NOT NULL,
    local_nome  VARCHAR(200),
    vagas       INT          DEFAULT 100,
    criado_em   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── Inscrições ────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS inscricoes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT NOT NULL,
    evento_id   INT NOT NULL,
    camiseta    ENUM('P','M','G','GG') DEFAULT 'M',
    areas       VARCHAR(200),
    inscrito_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_id)  REFERENCES eventos(id)  ON DELETE CASCADE,
    UNIQUE KEY uq_usuario_evento (usuario_id, evento_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // ── Seed: evento de exemplo ───────────────────────────────
  `INSERT IGNORE INTO eventos (id, titulo, descricao, data_inicio, local_nome, vagas)
   VALUES (1,
     'SIMEC 2025 — Simpósio de Engenharia da Computação',
     'Evento anual com palestras, workshops e feira de projetos.',
     '2025-11-15',
     'Bloco de TI — Universidade',
     200)`,
];

async function migrate() {
  console.log('🔄 Executando migrações...');
  for (const sql of migrations) {
    try {
      await pool.execute(sql);
      console.log('  ✅', sql.slice(0, 50).replace(/\s+/g, ' ') + '...');
    } catch (err) {
      console.error('  ❌ Erro na migração:', err.message);
      process.exit(1);
    }
  }
  console.log('🎉 Migrações concluídas!');
  process.exit(0);
}

migrate();
