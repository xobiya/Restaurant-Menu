const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const mariadb = require('mariadb');
const dotenv = require('dotenv');

dotenv.config({ override: true });

const clean = (value = '') => String(value || '').trim().replace(/^['"]|['"]$/g, '');

let rawUrl = clean(process.env.DATABASE_URL) || clean(process.env.MYSQL_URL);

if (!rawUrl) {
  const host = clean(process.env.MYSQLHOST);
  const user = clean(process.env.MYSQLUSER);
  const pwd = clean(process.env.MYSQLPASSWORD);
  const db = clean(process.env.MYSQLDATABASE);
  const port = clean(process.env.MYSQLPORT || '3306');
  if (host && user && db) {
    rawUrl = `mysql://${encodeURIComponent(user)}:${encodeURIComponent(pwd)}@${host}:${port}/${db}`;
  } else {
    throw new Error('DATABASE_URL is not set.');
  }
}

const url = new URL(rawUrl);

const pool = mariadb.createPool({
  host: url.hostname,
  port: url.port ? parseInt(url.port, 10) : 3306,
  user: url.username || 'root',
  password: url.password || '',
  database: url.pathname.replace(/^\//, ''),
  connectionLimit: 10,
  connectTimeout: 20000,
  allowPublicKeyRetrieval: true,
});

const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
