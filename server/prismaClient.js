const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const clean = (value = '') => String(value).trim().replace(/^['"]|['"]$/g, '');

const buildDatabaseUrlFromParts = () => {
  const host = clean(process.env.MYSQLHOST);
  const port = clean(process.env.MYSQLPORT || '3306');
  const user = clean(process.env.MYSQLUSER);
  const password = clean(process.env.MYSQLPASSWORD);
  const database = clean(process.env.MYSQLDATABASE);

  if (!host || !user || !database) return '';
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?allowPublicKeyRetrieval=true`;
};

const databaseUrl = clean(process.env.DATABASE_URL) || clean(process.env.MYSQL_URL) || buildDatabaseUrlFromParts();

if (!databaseUrl) {
  throw new Error('DATABASE_URL or MYSQL_URL is not set.');
}

const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
