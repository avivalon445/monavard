const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

class Logger {
  constructor() {
    this.logFile = process.env.LOG_FILE || path.join(logsDir, 'app.log');
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  /**
   * Format log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {any} meta - Additional metadata
   * @returns {string}
   */
  formatMessage(level, message, meta = null) {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  /**
   * Write log to file
   * @param {string} message - Formatted log message
   */
  writeToFile(message) {
    try {
      fs.appendFileSync(this.logFile, message + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {any} meta - Additional metadata
   */
  error(message, meta = null) {
    const formatted = this.formatMessage(LogLevel.ERROR, message, meta);
    console.error(`${colors.red}${formatted}${colors.reset}`);
    this.writeToFile(formatted);
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {any} meta - Additional metadata
   */
  warn(message, meta = null) {
    const formatted = this.formatMessage(LogLevel.WARN, message, meta);
    console.warn(`${colors.yellow}${formatted}${colors.reset}`);
    this.writeToFile(formatted);
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {any} meta - Additional metadata
   */
  info(message, meta = null) {
    const formatted = this.formatMessage(LogLevel.INFO, message, meta);
    console.log(`${colors.green}${formatted}${colors.reset}`);
    this.writeToFile(formatted);
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {any} meta - Additional metadata
   */
  debug(message, meta = null) {
    if (process.env.NODE_ENV === 'development') {
      const formatted = this.formatMessage(LogLevel.DEBUG, message, meta);
      console.log(`${colors.gray}${formatted}${colors.reset}`);
      this.writeToFile(formatted);
    }
  }

  /**
   * Create a stream for Morgan HTTP logger
   */
  get stream() {
    return {
      write: (message) => {
        this.info(message.trim());
      }
    };
  }
}

module.exports = new Logger();

