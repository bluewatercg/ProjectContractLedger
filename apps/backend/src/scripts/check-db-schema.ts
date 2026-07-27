import { createConnection } from 'mysql2/promise';

export async function checkSchema() {
  const connection = await createConnection({
    host: '192.168.1.254',
    user: 'root',
    password: '123456',
    database: 'procontractledger',
    charset: 'utf8mb4',
  });

  try {
    const [rows] = await connection.execute('DESCRIBE subscription_records;');
    console.log('subscription_records schema:');
    console.table(rows);

    const [renewalRows] = await connection.execute('DESCRIBE subscription_renewal_records;');
    console.log('subscription_renewal_records schema:');
    console.table(renewalRows);

    const [attachmentRows] = await connection.execute('DESCRIBE subscription_renewal_attachments;');
    console.log('subscription_renewal_attachments schema:');
    console.table(attachmentRows);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  checkSchema().catch(console.error);
}