const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const mariadb = require('mariadb');

const clean = (value = '') => String(value).trim().replace(/^['"]|['"]$/g, '');

const host = clean(process.env.MYSQLHOST) || clean(process.env.DB_HOST);
const port = clean(process.env.MYSQLPORT || process.env.DB_PORT || '3306');
const user = clean(process.env.MYSQLUSER) || clean(process.env.DB_USER);
const password = clean(process.env.MYSQLPASSWORD) || clean(process.env.DB_PASSWORD);
const database = clean(process.env.MYSQLDATABASE) || clean(process.env.DB_NAME);

let pool;

// Railway MySQL or manual env variables
if (host && user && database) {
  pool = mariadb.createPool({
    host,
    port: parseInt(port, 10),
    user,
    password,
    database,
    connectionLimit: 5,
  });
} else {
  // Fallback to local DATABASE_URL (mostly for local development)
  let databaseUrl = clean(process.env.DATABASE_URL) || clean(process.env.MYSQL_URL);
  if (!databaseUrl) {
    throw new Error('Database credentials (MYSQLHOST/MYSQLUSER/etc) or DATABASE_URL not set.');
  }
  
  // Transform 'mysql://' to 'mariadb://' if needed for the mariadb driver
  if (databaseUrl.startsWith('mysql://')) {
    databaseUrl = databaseUrl.replace('mysql://', 'mariadb://');
  }
  pool = mariadb.createPool(databaseUrl);
}

const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
