// api/_lib/utils.ts

/**
 * Helper function to rehydrate a JavaScript object from a Redis hash (HGETALL) response.
 * It intelligently parses values that are JSON strings while leaving other string values intact.
 * @param redisData The key-value record returned from a Redis HGETALL command.
 * @returns A reconstructed JavaScript object.
 */
export const hydrateObjectFromRedisHash = (redisData: Record<string, unknown> | null): Record<string, any> => {
    if (!redisData) return {};
    const rehydrated: Record<string, any> = {};
    for (const key in redisData) {
        if (Object.prototype.hasOwnProperty.call(redisData, key)) {
            const value = redisData[key];
            // The value from upstash/redis can be a string, or already parsed if it was simple.
            // We only want to parse strings that look like JSON.
            if (typeof value === 'string') {
                try {
                    if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
                        rehydrated[key] = JSON.parse(value);
                    } else {
                        rehydrated[key] = value;
                    }
                } catch (e) {
                    rehydrated[key] = value; // Not a JSON string, use as is
                }
            } else {
                // If it's not a string, it's probably a number, boolean, null, etc., so just assign it.
                rehydrated[key] = value;
            }
        }
    }
    return rehydrated;
};
