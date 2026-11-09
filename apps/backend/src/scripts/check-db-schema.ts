import { createConnection } from 'mysql2/promise';

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  charset: 'utf8mb4';
}

export function getDatabaseConfig(): DatabaseConfig {
  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USERNAME?.trim();
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_DATABASE?.trim();
  if (!host || !user || !password || !database) {
    const missing = [
      !host && 'DB_HOST',
      !user && 'DB_USERNAME',
      !password && 'DB_PASSWORD',
      !database && 'DB_DATABASE',
    ].filter(Boolean);
    throw new Error(
      `Missing database environment variables: ${missing.join(', ')}`
    );
  }

  return {
    host,
    port: Number(process.env.DB_PORT || 3306),
    user,
    password,
    database,
    charset: 'utf8mb4',
  };
}

export async function checkSchema() {
  const connection = await createConnection(getDatabaseConfig());

  try {
    const [rows] = await connection.execute('DESCRIBE subscription_records;');
    console.log('subscription_records schema:');
    console.table(rows);

    const [renewalRows] = await connection.execute(
      'DESCRIBE subscription_renewal_records;'
    );
    console.log('subscription_renewal_records schema:');
    console.table(renewalRows);

    const [attachmentRows] = await connection.execute(
      'DESCRIBE subscription_renewal_attachments;'
    );
    console.log('subscription_renewal_attachments schema:');
    console.table(attachmentRows);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  require('dotenv').config();
  checkSchema().catch(console.error);
}
