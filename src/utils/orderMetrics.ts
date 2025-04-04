/**
 * Order Metrics Utility
 * 
 * This utility provides functions to track and analyze order processing metrics.
 */

// Define metrics types
interface OrderMetrics {
  totalOrders: number;
  successfulOrders: number;
  failedOrders: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  statusCounts: Record<string, number>;
  paymentMethodCounts: Record<string, number>;
  errorCounts: Record<string, number>;
  hourlyDistribution: number[];
}

// Initialize metrics
const metrics: OrderMetrics = {
  totalOrders: 0,
  successfulOrders: 0,
  failedOrders: 0,
  averageProcessingTime: 0,
  totalProcessingTime: 0,
  statusCounts: {},
  paymentMethodCounts: {},
  errorCounts: {},
  hourlyDistribution: Array(24).fill(0)
};

/**
 * Record a new order
 */
export function recordNewOrder(): void {
  metrics.totalOrders++;
  
  // Record hourly distribution
  const hour = new Date().getHours();
  metrics.hourlyDistribution[hour]++;
}

/**
 * Record a successful order
 * @param processingTime Processing time in milliseconds
 * @param status Order status
 * @param paymentMethod Payment method
 */
export function recordSuccessfulOrder(
  processingTime: number,
  status: string,
  paymentMethod: string
): void {
  metrics.successfulOrders++;
  
  // Update processing time metrics
  metrics.totalProcessingTime += processingTime;
  metrics.averageProcessingTime = metrics.totalProcessingTime / metrics.successfulOrders;
  
  // Update status counts
  metrics.statusCounts[status] = (metrics.statusCounts[status] || 0) + 1;
  
  // Update payment method counts
  metrics.paymentMethodCounts[paymentMethod] = (metrics.paymentMethodCounts[paymentMethod] || 0) + 1;
}

/**
 * Record a failed order
 * @param processingTime Processing time in milliseconds
 * @param errorCodes Array of error codes
 */
export function recordFailedOrder(
  processingTime: number,
  errorCodes: string[]
): void {
  metrics.failedOrders++;
  
  // Update error counts
  errorCodes.forEach(code => {
    metrics.errorCounts[code] = (metrics.errorCounts[code] || 0) + 1;
  });
}

/**
 * Get order metrics
 * @returns Current order metrics
 */
export function getOrderMetrics(): OrderMetrics {
  return { ...metrics };
}

/**
 * Reset order metrics
 */
export function resetOrderMetrics(): void {
  metrics.totalOrders = 0;
  metrics.successfulOrders = 0;
  metrics.failedOrders = 0;
  metrics.averageProcessingTime = 0;
  metrics.totalProcessingTime = 0;
  metrics.statusCounts = {};
  metrics.paymentMethodCounts = {};
  metrics.errorCounts = {};
  metrics.hourlyDistribution = Array(24).fill(0);
}

/**
 * Get success rate
 * @returns Success rate as a percentage
 */
export function getSuccessRate(): number {
  if (metrics.totalOrders === 0) return 0;
  return (metrics.successfulOrders / metrics.totalOrders) * 100;
}

/**
 * Get most common error
 * @returns Most common error code and count
 */
export function getMostCommonError(): { code: string; count: number } | null {
  const errorCodes = Object.keys(metrics.errorCounts);
  if (errorCodes.length === 0) return null;
  
  let maxCode = errorCodes[0];
  let maxCount = metrics.errorCounts[maxCode];
  
  errorCodes.forEach(code => {
    if (metrics.errorCounts[code] > maxCount) {
      maxCode = code;
      maxCount = metrics.errorCounts[code];
    }
  });
  
  return { code: maxCode, count: maxCount };
}

/**
 * Get most popular payment method
 * @returns Most popular payment method and count
 */
export function getMostPopularPaymentMethod(): { method: string; count: number } | null {
  const methods = Object.keys(metrics.paymentMethodCounts);
  if (methods.length === 0) return null;
  
  let maxMethod = methods[0];
  let maxCount = metrics.paymentMethodCounts[maxMethod];
  
  methods.forEach(method => {
    if (metrics.paymentMethodCounts[method] > maxCount) {
      maxMethod = method;
      maxCount = metrics.paymentMethodCounts[method];
    }
  });
  
  return { method: maxMethod, count: maxCount };
}

/**
 * Get peak order hour
 * @returns Hour with most orders and count
 */
export function getPeakOrderHour(): { hour: number; count: number } {
  let maxHour = 0;
  let maxCount = metrics.hourlyDistribution[0];
  
  metrics.hourlyDistribution.forEach((count, hour) => {
    if (count > maxCount) {
      maxHour = hour;
      maxCount = count;
    }
  });
  
  return { hour: maxHour, count: maxCount };
}
