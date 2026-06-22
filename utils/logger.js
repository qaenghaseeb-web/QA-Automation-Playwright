/**
 * logger.js — Structured logging for the QA framework
 *
 * Provides timestamped, level-based console logging.
 * Integrates with Playwright test info for report attachment.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  /**
   * @param {string} context - Logger context name (e.g., 'HomepageTest')
   * @param {string} level - Minimum log level ('DEBUG', 'INFO', 'WARN', 'ERROR')
   */
  constructor(context = 'QA-Framework', level = 'INFO') {
    this.context = context;
    this.minLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
    this.logs = [];
  }

  /**
   * Format a log entry with timestamp, level, and context
   * @param {string} level
   * @param {string} message
   * @param {object} data
   * @returns {string}
   */
  _format(level, message, data) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] [${level}] [${this.context}] ${message}`;
    if (data && Object.keys(data).length > 0) {
      return `${entry} | ${JSON.stringify(data)}`;
    }
    return entry;
  }

  /**
   * Internal log method
   * @param {string} level
   * @param {string} message
   * @param {object} data
   */
  _log(level, message, data = {}) {
    if (LOG_LEVELS[level] < this.minLevel) return;

    const formatted = this._format(level, message, data);
    this.logs.push({ timestamp: new Date().toISOString(), level, message, data });

    switch (level) {
      case 'ERROR':
        console.error(formatted);
        break;
      case 'WARN':
        console.warn(formatted);
        break;
      case 'DEBUG':
        console.debug(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  /**
   * Log a debug message
   * @param {string} message
   * @param {object} data - Optional structured data
   */
  debug(message, data = {}) {
    this._log('DEBUG', message, data);
  }

  /**
   * Log an info message
   * @param {string} message
   * @param {object} data - Optional structured data
   */
  info(message, data = {}) {
    this._log('INFO', message, data);
  }

  /**
   * Log a warning message
   * @param {string} message
   * @param {object} data - Optional structured data
   */
  warn(message, data = {}) {
    this._log('WARN', message, data);
  }

  /**
   * Log an error message
   * @param {string} message
   * @param {object} data - Optional structured data
   */
  error(message, data = {}) {
    this._log('ERROR', message, data);
  }

  /**
   * Log a test step (for readability in reports)
   * @param {string} step - Step description
   */
  step(step) {
    this.info(`📌 STEP: ${step}`);
  }

  /**
   * Log a test result
   * @param {string} testName
   * @param {boolean} passed
   * @param {string} details
   */
  result(testName, passed, details = '') {
    const icon = passed ? '✅' : '❌';
    this.info(`${icon} ${testName}${details ? ` — ${details}` : ''}`);
  }

  /**
   * Get all collected logs
   * @returns {Array}
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Attach logs to Playwright test info (appears in HTML report)
   * @param {import('@playwright/test').TestInfo} testInfo
   */
  async attachToReport(testInfo) {
    const logContent = this.logs
      .map((log) => this._format(log.level, log.message, log.data))
      .join('\n');

    await testInfo.attach('test-logs', {
      body: logContent,
      contentType: 'text/plain',
    });
  }
}

/**
 * Create a logger instance for a test context
 * @param {string} context
 * @returns {Logger}
 */
function createLogger(context) {
  return new Logger(context, process.env.CI ? 'INFO' : 'DEBUG');
}

module.exports = { Logger, createLogger };
