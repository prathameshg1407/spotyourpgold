import { connectToDB } from './connectdb.js';

/**
 * Wraps database operations with connection and timeout protection
 * Essential for Vercel serverless environment
 */
export const withDatabaseConnection = async (operation) => {
    const timeoutMs = 8000; // 8 seconds - leave 2s buffer for Vercel's 10s limit

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
    });

    try {
        // Ensure connection with timeout
        await Promise.race([
            connectToDB(),
            timeoutPromise
        ]);

        // Execute the database operation with timeout
        const result = await Promise.race([
            operation(),
            timeoutPromise
        ]);

        return result;
    } catch (error) {
        console.error('Database operation failed:', error);
        throw error;
    }
};

/**
 * Optimized query execution with lean() and minimal fields
 */
export const executeOptimizedQuery = async (query, options = {}) => {
    const {
        lean = true,
        timeout = 8000,
        select = null,
        limit = null,
        sort = null
    } = options;

    let optimizedQuery = query;

    if (lean) optimizedQuery = optimizedQuery.lean();
    if (select) optimizedQuery = optimizedQuery.select(select);
    if (limit) optimizedQuery = optimizedQuery.limit(limit);
    if (sort) optimizedQuery = optimizedQuery.sort(sort);

    return await optimizedQuery.maxTimeMS(timeout);
};
