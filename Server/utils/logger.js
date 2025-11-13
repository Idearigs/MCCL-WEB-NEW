/**
 * Simple Logger Utility
 * Used for consistent logging across the application
 */

const logger = {
  /**
   * Log info level messages
   */
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'INFO',
      timestamp,
      message,
      ...meta
    };
    console.log(JSON.stringify(logEntry));
  },

  /**
   * Log error level messages
   */
  error: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'ERROR',
      timestamp,
      message,
      ...meta
    };
    console.error(JSON.stringify(logEntry));
  },

  /**
   * Log warning level messages
   */
  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'WARN',
      timestamp,
      message,
      ...meta
    };
    console.warn(JSON.stringify(logEntry));
  },

  /**
   * Log debug level messages
   */
  debug: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level: 'DEBUG',
      timestamp,
      message,
      ...meta
    };
    if (process.env.DEBUG === 'true') {
      console.log(JSON.stringify(logEntry));
    }
  }
};

module.exports = logger;
