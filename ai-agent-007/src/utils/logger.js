/**
 * Logger Utility
 * 
 * Provides consistent logging across the agent
 */

import chalk from 'chalk';

class Logger {
  constructor(level = 'info') {
    this.level = level;
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
  }

  shouldLog(level) {
    return this.levels[level] >= this.levels[this.level];
  }

  debug(...args) {
    if (this.shouldLog('debug')) {
      console.log(chalk.gray('[DEBUG]'), ...args);
    }
  }

  info(...args) {
    if (this.shouldLog('info')) {
      console.log(chalk.blue('[INFO]'), ...args);
    }
  }

  warn(...args) {
    if (this.shouldLog('warn')) {
      console.log(chalk.yellow('[WARN]'), ...args);
    }
  }

  error(...args) {
    if (this.shouldLog('error')) {
      console.error(chalk.red('[ERROR]'), ...args);
    }
  }

  success(...args) {
    if (this.shouldLog('info')) {
      console.log(chalk.green('[SUCCESS]'), ...args);
    }
  }
}

let loggerInstance = null;

export function setupLogger(level = process.env.LOG_LEVEL || 'info') {
  if (!loggerInstance) {
    loggerInstance = new Logger(level);
  }
  return loggerInstance;
}

export function getLogger() {
  if (!loggerInstance) {
    return setupLogger();
  }
  return loggerInstance;
}
