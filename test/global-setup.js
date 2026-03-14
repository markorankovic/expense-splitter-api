const { execFileSync } = require('node:child_process');
const { URL } = require('node:url');
const { Client } = require('pg');

function quoteIdentifier(identifier) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

module.exports = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set for e2e tests');
  }

  const targetUrl = new URL(databaseUrl);
  const databaseName = targetUrl.pathname.replace(/^\//, '');
  if (!databaseName) {
    throw new Error('DATABASE_URL must include a database name');
  }

  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = '/postgres';

  const adminClient = new Client({ connectionString: adminUrl.toString() });
  await adminClient.connect();

  try {
    const result = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );

    if (result.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
    }
  } finally {
    await adminClient.end();
  }

  execFileSync(
    'npx',
    ['prisma', 'generate'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      stdio: 'inherit',
    },
  );

  execFileSync(
    'npx',
    ['prisma', 'migrate', 'deploy'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      stdio: 'inherit',
    },
  );
};
