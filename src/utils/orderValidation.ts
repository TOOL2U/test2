/**
 * Order validation utility
 * 
 * This utility provides functions to validate orders before processing.
 */
import { Order } from '../context/OrderContext';

// Define validation error types
export interface ValidationError {
  code: string;
  field: string;
  message: string;
}

// Define validation result
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Define metrics for order validation
export interface OrderValidationMetrics {
  startTime: number;
  endTime?: number;
  processingDuration?: number;
  isValid?: boolean;
  errorCount?: number;
  retryCount: number;
}

/**
 * Initialize metrics for order validation
 * @returns Initial metrics object
 */
export function initOrderMetrics(): OrderValidationMetrics {
  return {
    startTime: Date.now(),
    retryCount: 0
  };
}

/**
 * Complete metrics for order validation
 * @param metrics Initial metrics object
 * @param isValid Whether validation was successful
 * @param errorCount Number of validation errors
 * @returns Updated metrics object
 */
export function completeOrderMetrics(
  metrics: OrderValidationMetrics,
  isValid: boolean,
  errorCount: number
): OrderValidationMetrics {
  const endTime = Date.now();
  return {
    ...metrics,
    endTime,
    processingDuration: endTime - metrics.startTime,
    isValid,
    errorCount
  };
}

/**
 * Increment retry count in metrics
 * @param metrics Metrics object
 * @returns Updated metrics object
 */
export function incrementRetryCount(metrics: OrderValidationMetrics): OrderValidationMetrics {
  return {
    ...metrics,
    retryCount: (metrics.retryCount || 0) + 1
  };
}

/**
 * Generate a unique order ID
 * @returns Unique order ID
 */
export function generateOrderId(): string {
  const prefix = 'ORD-';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
}

/**
 * Validate an order
 * @param order Order to validate
 * @returns Validation result
 */
export function validateOrder(order: Order): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Validate customer info
  if (!order.customerInfo) {
    errors.push({
      code: 'MISSING_CUSTOMER_INFO',
      field: 'customerInfo',
      message: 'Customer information is required'
    });
  } else {
    if (!order.customerInfo.name || order.customerInfo.name.trim() === '') {
      errors.push({
        code: 'MISSING_CUSTOMER_NAME',
        field: 'customerInfo.name',
        message: 'Customer name is required'
      });
    }
    
    if (!order.customerInfo.email || order.customerInfo.email.trim() === '') {
      errors.push({
        code: 'MISSING_CUSTOMER_EMAIL',
        field: 'customerInfo.email',
        message: 'Customer email is required'
      });
    } else if (!isValidEmail(order.customerInfo.email)) {
      errors.push({
        code: 'INVALID_CUSTOMER_EMAIL',
        field: 'customerInfo.email',
        message: 'Customer email is invalid'
      });
    }
    
    if (!order.customerInfo.phone || order.customerInfo.phone.trim() === '') {
      errors.push({
        code: 'MISSING_CUSTOMER_PHONE',
        field: 'customerInfo.phone',
        message: 'Customer phone is required'
      });
    } else if (!isValidPhone(order.customerInfo.phone)) {
      errors.push({
        code: 'INVALID_CUSTOMER_PHONE',
        field: 'customerInfo.phone',
        message: 'Customer phone is invalid'
      });
    }
  }
  
  // Validate items
  if (!order.items || order.items.length === 0) {
    errors.push({
      code: 'EMPTY_ITEMS',
      field: 'items',
      message: 'Order must contain at least one item'
    });
  } else {
    order.items.forEach((item, index) => {
      if (!item.id) {
        errors.push({
          code: 'MISSING_ITEM_ID',
          field: `items[${index}].id`,
          message: `Item at index ${index} is missing an ID`
        });
      }
      
      if (!item.name) {
        errors.push({
          code: 'MISSING_ITEM_NAME',
          field: `items[${index}].name`,
          message: `Item at index ${index} is missing a name`
        });
      }
      
      if (typeof item.price !== 'number' || item.price <= 0) {
        errors.push({
          code: 'INVALID_ITEM_PRICE',
          field: `items[${index}].price`,
          message: `Item at index ${index} has an invalid price`
        });
      }
      
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push({
          code: 'INVALID_ITEM_QUANTITY',
          field: `items[${index}].quantity`,
          message: `Item at index ${index} has an invalid quantity`
        });
      }
    });
  }
  
  // Validate delivery address
  if (!order.deliveryAddress || order.deliveryAddress.trim() === '') {
    errors.push({
      code: 'MISSING_DELIVERY_ADDRESS',
      field: 'deliveryAddress',
      message: 'Delivery address is required'
    });
  }
  
  // Validate payment method
  if (!order.paymentMethod || order.paymentMethod.trim() === '') {
    errors.push({
      code: 'MISSING_PAYMENT_METHOD',
      field: 'paymentMethod',
      message: 'Payment method is required'
    });
  }
  
  // Validate total amount
  if (typeof order.totalAmount !== 'number' || order.totalAmount <= 0) {
    errors.push({
      code: 'INVALID_TOTAL_AMOUNT',
      field: 'totalAmount',
      message: 'Total amount must be a positive number'
    });
  } else {
    // Verify total amount matches sum of items
    const calculatedTotal = order.items.reduce((total, item) => {
      return total + (item.price * item.quantity * (item.days || 1));
    }, 0);
    
    // Allow for small rounding differences (up to 1 unit)
    if (Math.abs(calculatedTotal - order.totalAmount) > 1) {
      errors.push({
        code: 'TOTAL_AMOUNT_MISMATCH',
        field: 'totalAmount',
        message: `Total amount (${order.totalAmount}) does not match calculated total (${calculatedTotal})`
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate an email address
 * @param email Email address to validate
 * @returns Whether the email is valid
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate a phone number
 * @param phone Phone number to validate
 * @returns Whether the phone number is valid
 */
function isValidPhone(phone: string): boolean {
  // Allow various formats: +66123456789, 0123456789, +1 123-456-7890, etc.
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
}
