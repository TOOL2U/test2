/**
 * Order Logger Utility
 * 
 * This utility provides logging functions for order-related operations.
 */
import { ValidationResult } from './orderValidation';

// Define log levels
type LogLevel = 'info' | 'warning' | 'error' | 'debug';

// Define log entry
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  orderId: string;
  message: string;
  data?: any;
}

// Maximum number of log entries to keep in memory
const MAX_LOG_ENTRIES = 1000;

// In-memory log storage
const logEntries: LogEntry[] = [];

/**
 * Add a log entry
 * @param level Log level
 * @param orderId Order ID
 * @param message Log message
 * @param data Additional data
 */
function addLogEntry(level: LogLevel, orderId: string, message: string, data?: any): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    orderId,
    message,
    data
  };
  
  // Add to in-memory log
  logEntries.unshift(entry);
  
  // Trim log if it gets too large
  if (logEntries.length > MAX_LOG_ENTRIES) {
    logEntries.pop();
  }
  
  // Log to console with appropriate level
  const consoleMessage = `[${entry.timestamp}] [${level.toUpperCase()}] [Order: ${orderId}] ${message}`;
  
  switch (level) {
    case 'info':
      console.info(consoleMessage, data);
      break;
    case 'warning':
      console.warn(consoleMessage, data);
      break;
    case 'error':
      console.error(consoleMessage, data);
      break;
    case 'debug':
      console.debug(consoleMessage, data);
      break;
  }
}

/**
 * Order logger utility
 */
export const orderLogger = {
  /**
   * Log an informational message
   * @param orderId Order ID
   * @param message Log message
   * @param data Additional data
   */
  info: (orderId: string, message: string, data?: any): void => {
    addLogEntry('info', orderId, message, data);
  },
  
  /**
   * Log a warning message
   * @param orderId Order ID
   * @param message Log message
   * @param data Additional data
   */
  warning: (orderId: string, message: string, data?: any): void => {
    addLogEntry('warning', orderId, message, data);
  },
  
  /**
   * Log an error message
   * @param orderId Order ID
   * @param message Log message
   * @param data Additional data
   */
  error: (orderId: string, message: string, data?: any): void => {
    addLogEntry('error', orderId, message, data);
  },
  
  /**
   * Log a debug message
   * @param orderId Order ID
   * @param message Log message
   * @param data Additional data
   */
  debug: (orderId: string, message: string, data?: any): void => {
    addLogEntry('debug', orderId, message, data);
  },
  
  /**
   * Log order creation
   * @param orderId Order ID
   * @param orderData Order data
   */
  orderCreated: (orderId: string, orderData: any): void => {
    addLogEntry('info', orderId, 'Order created', {
      customerInfo: orderData.customerInfo,
      items: orderData.items.length,
      totalAmount: orderData.totalAmount,
      paymentMethod: orderData.paymentMethod
    });
  },
  
  /**
   * Log order validation
   * @param orderId Order ID
   * @param validationResult Validation result
   */
  orderValidated: (orderId: string, validationResult: ValidationResult): void => {
    addLogEntry('info', orderId, 'Order validated successfully', {
      isValid: validationResult.isValid
    });
  },
  
  /**
   * Log order validation failure
   * @param orderId Order ID
   * @param validationResult Validation result
   */
  orderValidationFailed: (orderId: string, validationResult: ValidationResult): void => {
    addLogEntry('error', orderId, 'Order validation failed', {
      errors: validationResult.errors
    });
  },
  
  /**
   * Log order status change
   * @param orderId Order ID
   * @param oldStatus Old status
   * @param newStatus New status
   */
  orderStatusChanged: (orderId: string, oldStatus: string, newStatus: string): void => {
    addLogEntry('info', orderId, `Order status changed from "${oldStatus}" to "${newStatus}"`);
  },
  
  /**
   * Get all log entries
   * @returns Array of log entries
   */
  getLogs: (): LogEntry[] => {
    return [...logEntries];
  },
  
  /**
   * Get logs for a specific order
   * @param orderId Order ID
   * @returns Array of log entries for the order
   */
  getOrderLogs: (orderId: string): LogEntry[] => {
    return logEntries.filter(entry => entry.orderId === orderId);
  },
  
  /**
   * Get logs by level
   * @param level Log level
   * @returns Array of log entries with the specified level
   */
  getLogsByLevel: (level: LogLevel): LogEntry[] => {
    return logEntries.filter(entry => entry.level === level);
  },
  
  /**
   * Clear all logs
   */
  clearLogs: (): void => {
    logEntries.length = 0;
  }
};
