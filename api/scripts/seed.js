const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    // Check if tenant exists
    let res = await client.query("SELECT id FROM tenants WHERE nome = 'Prefeitura Demo'");
    let tenantId;

    if (res.rows.length === 0) {
      res = await client.query(
        "INSERT INTO tenants (nome, cidade, estado) VALUES ($1, $2, $3) RETURNING id",
        ['Prefeitura Demo', 'Brasilia', 'DF']
      );
      tenantId = res.rows[0].id;
      console.log('Tenant criado:', tenantId);
    } else {
      tenantId = res.rows[0].id;
      console.log('Tenant existente:', tenantId);
    }

    // Check if gestor exists (by email)
    res = await client.query("SELECT id FROM gestores WHERE email = 'samuelscosta24@gmail.com'");

    if (res.rows.length === 0) {
      // Pre-register gestor (firebase_uid will be set on first login)
      await client.query(
        "INSERT INTO gestores (tenant_id, nome, email) VALUES ($1, $2, $3)",
        [tenantId, 'Samuel Costa', 'samuelscosta24@gmail.com']
      );
      console.log('Gestor pre-registrado: samuelscosta24@gmail.com');
    } else {
      console.log('Gestor existente:', res.rows[0].id);
    }

    console.log('\nPara testar o login:');
    console.log('1. Acesse http://localhost:5173');
    console.log('2. Clique em "Entrar com Google"');
    console.log('3. Use samuelscosta24@gmail.com');
    console.log('\nSeed concluido!');
  } finally {
    client.release();
    pool.end();
  }
}

seed().catch(console.error);
