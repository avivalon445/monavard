const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

/**
 * Convert parameters to ensure proper types for MySQL compatibility
 * @param {Array} params - Parameters to convert
 * @returns {Array} Converted parameters
 */
const convertParameters = (params) => {
  return params.map(param => {
    if (param === null || param === undefined) {
      return null;
    }
    if (param instanceof Date) {
      return param.toISOString().slice(0, 19).replace('T', ' ');
    }
    if (typeof param === 'boolean') {
      return param ? 1 : 0;
    }
    if (typeof param === 'number' && !Number.isFinite(param)) {
      return null;
    }
    if (typeof param === 'object' && param !== null) {
      // Convert objects to JSON strings
      return JSON.stringify(param);
    }
    return param;
  });
};

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
  dateStrings: true,
  // MySQL 9.x compatibility settings
  supportBigNumbers: true,
  bigNumberStrings: true,
  typeCast: true,
  // Additional compatibility settings
  charset: 'utf8mb4',
  timezone: 'Z',
  // Disable SSL for local development, enable for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
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
 * Execute a query with enhanced error handling and parameter conversion
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>}
 */
const query = async (sql, params = []) => {
  try {
    const db = await connectDatabase();
    
    // Convert parameters to ensure proper types for MySQL 9.x compatibility
    const convertedParams = convertParameters(params);
    
    const [rows] = await db.execute(sql, convertedParams);
    return rows;
  } catch (error) {
    logger.error('Database query error:', {
      error: error.message,
      sql: sql.substring(0, 100) + '...',
      params: params
    });
    
    // Handle specific MySQL errors
    if (error.code === 'ER_STMT_EXECUTE_ERROR' || error.message.includes('mysqld_stmt_execute')) {
      logger.error('MySQL statement execution error - attempting query without prepared statements');
      try {
        // Fallback to query method without prepared statements
        const db = await connectDatabase();
        const [rows] = await db.query(sql, params);
        return rows;
      } catch (fallbackError) {
        logger.error('Fallback query also failed:', fallbackError);
        throw error; // Throw original error
      }
    }
    
    throw error;
  }
};

/**
 * Execute a transaction with enhanced error handling
 * @param {Function} callback - Transaction callback function
 * @returns {Promise<any>}
 */
const transaction = async (callback) => {
  const db = await connectDatabase();
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Wrap the callback to handle parameter conversion
    const wrappedCallback = async (conn) => {
      // Create a wrapper connection with enhanced query method
      const enhancedConnection = {
        ...conn,
        execute: async (sql, params = []) => {
          const convertedParams = convertParameters(params);
          
          try {
            return await conn.execute(sql, convertedParams);
          } catch (error) {
            if (error.code === 'ER_STMT_EXECUTE_ERROR' || error.message.includes('mysqld_stmt_execute')) {
              logger.warn('Prepared statement failed, using query method');
              return await conn.query(sql, params);
            }
            throw error;
          }
        }
      };
      
      return await callback(enhancedConnection);
    };
    
    const result = await wrappedCallback(connection);
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
 * Call a stored procedure with enhanced error handling
 * @param {string} procedureName - Name of the stored procedure
 * @param {Array} params - Procedure parameters
 * @returns {Promise<any>}
 */
const callProcedure = async (procedureName, params = []) => {
  try {
    const db = await connectDatabase();
    const placeholders = params.map(() => '?').join(', ');
    const sql = `CALL ${procedureName}(${placeholders})`;
    
    // Convert parameters for compatibility
    const convertedParams = convertParameters(params);
    
    const [results] = await db.execute(sql, convertedParams);
    return results;
  } catch (error) {
    logger.error(`Error calling procedure ${procedureName}:`, error);
    
    // Handle specific MySQL errors for stored procedures
    if (error.code === 'ER_STMT_EXECUTE_ERROR' || error.message.includes('mysqld_stmt_execute')) {
      logger.warn(`Prepared statement failed for procedure ${procedureName}, using query method`);
      try {
        const db = await connectDatabase();
        const placeholders = params.map(() => '?').join(', ');
        const sql = `CALL ${procedureName}(${placeholders})`;
        const [results] = await db.query(sql, params);
        return results;
      } catch (fallbackError) {
        logger.error(`Fallback query for procedure ${procedureName} also failed:`, fallbackError);
        throw error; // Throw original error
      }
    }
    
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

