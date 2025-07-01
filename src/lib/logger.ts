/**
 * Simple logging utility
 * - Supports multiple log levels (info, warn, debug, error)
 * - Color coded console output
 * - Can be enabled/disabled globally or per level
 */

type LogLevel = 'info' | 'warn' | 'debug' | 'error';

interface LoggerConfig {
  enabled: boolean;
  levels: Record<LogLevel, boolean>;
}

const config: LoggerConfig = {
  enabled: true,
  levels: {
    info: true,
    warn: true,
    debug: true,
    error: true
  }
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  info: '\x1b[36m', // Cyan
  warn: '\x1b[33m', // Yellow
  debug: '\x1b[35m', // Magenta
  error: '\x1b[31m', // Red
  time: '\x1b[90m', // Gray
};

/**
 * Format a message with appropriate prefix and color
 */
const formatMessage = (level: LogLevel, ...args: string[]): string[] => {
  const timestamp = new Date().toISOString();
  const prefix = `${colors.time}[${timestamp}]${colors.reset} ${colors[level]}[${level.toUpperCase()}]${colors.reset}`;
  return [prefix, ...args];
};

/**
 * Logger utility with various log levels
 */
export const logger = {
  /**
   * Log informational messages
   */
  info: (...args: string[]): void => {
    if (config.enabled && config.levels.info) {
      console.info(...formatMessage('info', ...args));
    }
  },

  /**
   * Log warning messages
   */
  warn: (...args: string[]): void => {
    if (config.enabled && config.levels.warn) {
      console.warn(...formatMessage('warn', ...args));
    }
  },

  /**
   * Log debug messages
   */
  debug: (...args: string[]): void => {
    if (config.enabled && config.levels.debug) {
      console.debug(...formatMessage('debug', ...args));
    }
  },

  /**
   * Log error messages
   */
  error: (...args: string[]): void => {
    if (config.enabled && config.levels.error) {
      console.error(...formatMessage('error', ...args));
    }
  },

  /**
   * Configure the logger
   */
  configure: (newConfig: Partial<LoggerConfig>): void => {
    Object.assign(config, newConfig);
  },

  /**
   * Get the current logger configuration
   */
  getConfig: (): LoggerConfig => ({ ...config }),
};
