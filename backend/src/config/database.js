const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Database connection pool configuration
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'custombid',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: false,
  dateStrings: true
};

// Create connection pool
let pool = null;

/**
 * Get or create database connection pool
 * @returns {Promise<mysql.Pool>}
 */
const connectDatabase = async () => {
  if (!pool) {
    try {
      pool = mysql.createPool(poolConfig);
      logger.info('Database pool created successfully');
    } catch (error) {
      logger.error('Error creating database pool:', error);
      throw error;
    }
  }
  return pool;
};

/**
 * Test database connection
 * @returns {Promise<boolean>}
 */
const testConnection = async () => {
  try {
    const db = await connectDatabase();
    const connection = await db.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    throw new Error('Unable to connect to database');
  }
};

/**
 * Execute a query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>}
 */
const query = async (sql, params = []) => {
  try {
    const db = await connectDatabase();
    const [rows] = await db.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
};

/**
 * Execute a transaction
 * @param {Function} callback - Transaction callback function
 * @returns {Promise<any>}
 */
const transaction = async (callback) => {
  const db = await connectDatabase();
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('Transaction error:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Call a stored procedure
 * @param {string} procedureName - Name of the stored procedure
 * @param {Array} params - Procedure parameters
 * @returns {Promise<any>}
 */
const callProcedure = async (procedureName, params = []) => {
  try {
    const db = await connectDatabase();
    const placeholders = params.map(() => '?').join(', ');
    const sql = `CALL ${procedureName}(${placeholders})`;
    const [results] = await db.execute(sql, params);
    return results;
  } catch (error) {
    logger.error(`Error calling procedure ${procedureName}:`, error);
    throw error;
  }
};

module.exports = {
  connectDatabase,
  testConnection,
  query,
  transaction,
  callProcedure,
  pool: () => pool
};

