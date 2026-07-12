import { CoreTestingOrder } from '../components/testing/CoreTestingOrders';

/**
 * Safely resolves the order ID from a CoreTestingOrder object.
 * Uses a fallback chain to ensure a non-null string is always returned.
 * 
 * Priority order:
 * 1. mainOrderId (preferred)
 * 2. orderId (if string)
 * 3. orderId._id (if orderId is an object)
 * 4. _id (fallback)
 * 5. '' (empty string as last resort)
 * 
 * @param order - The CoreTestingOrder object
 * @returns A guaranteed non-null string representing the order ID
 * 
 * @example
 * const safeOrderId = getSafeOrderId(order);
 * // Always safe to use, never undefined
 */
export function getSafeOrderId(order: CoreTestingOrder): string {
    // Check mainOrderId first (preferred field)
    if (order?.mainOrderId && typeof order.mainOrderId === 'string') {
        return order.mainOrderId;
    }

    // Check orderId - could be string or object with _id
    if (order?.orderId) {
        if (typeof order.orderId === 'string') {
            return order.orderId;
        }
        // Handle case where orderId is an object with _id property
        if (typeof order.orderId === 'object' && order.orderId !== null && '_id' in order.orderId) {
            return (order.orderId as { _id: string })._id;
        }
    }

    // Fallback to _id
    if (order?._id && typeof order._id === 'string') {
        return order._id;
    }

    // Last resort: return empty string (safe default)
    return '';
}

/**
 * Safely resolves the client name from a CoreTestingOrder object.
 * 
 * @param order - The CoreTestingOrder object
 * @returns A guaranteed non-null string representing the client name
 * 
 * @example
 * const safeClientName = getSafeClientName(order);
 */
export function getSafeClientName(order: CoreTestingOrder): string {
    return order?.clientName || '';
}

/**
 * Safely resolves the batch/job ID from a CoreTestingOrder object.
 * 
 * @param order - The CoreTestingOrder object
 * @returns A guaranteed non-null string representing the batch/job ID
 * 
 * @example
 * const safeBatchId = getSafeBatchId(order);
 */
export function getSafeBatchId(order: CoreTestingOrder): string {
    return order?.jobId || '';
}

/**
 * Generic safe field accessor for CoreTestingOrder objects.
 * Provides type-safe access to any field with a default fallback value.
 * 
 * @param order - The CoreTestingOrder object
 * @param field - The field name to access
 * @param defaultValue - The default value to return if field is undefined/null
 * @returns The field value or the default value
 * 
 * @example
 * const transformerName = getSafeOrderField(order, 'transformerName', 'Unknown');
 * const quantity = getSafeOrderField(order, 'quantity', 0);
 */
export function getSafeOrderField<T>(
    order: CoreTestingOrder,
    field: keyof CoreTestingOrder,
    defaultValue: T
): T {
    const value = order?.[field];

    // Return the value if it exists and is not null/undefined
    if (value !== null && value !== undefined) {
        return value as T;
    }

    return defaultValue;
}

/**
 * Safely resolves the transformer name from a CoreTestingOrder object.
 * 
 * @param order - The CoreTestingOrder object
 * @returns A guaranteed non-null string representing the transformer name
 * 
 * @example
 * const safeTransformerName = getSafeTransformerName(order);
 */
export function getSafeTransformerName(order: CoreTestingOrder): string {
    return order?.transformerName || '';
}

/**
 * Safely resolves the transformer type from a CoreTestingOrder object.
 * 
 * @param order - The CoreTestingOrder object
 * @returns A guaranteed non-null string representing the transformer type
 * 
 * @example
 * const safeTransformerType = getSafeTransformerType(order);
 */
export function getSafeTransformerType(order: CoreTestingOrder): string {
    return order?.transformerType || '';
}

/**
 * Safely resolves the transformer quantity from a CoreTestingOrder object.
 * Handles both 'quantity' and 'transformerQuantity' fields.
 * 
 * @param order - The CoreTestingOrder object
 * @returns A guaranteed non-null number representing the quantity
 * 
 * @example
 * const safeQuantity = getSafeTransformerQuantity(order);
 */
export function getSafeTransformerQuantity(order: CoreTestingOrder): number {
    return order?.transformerQuantity || order?.quantity || 0;
}
