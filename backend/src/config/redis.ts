import IORedis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();
export const redisConnection = new IORedis(process.env.REDIS_URI || process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});
redisConnection.on('error', (err) => {
    console.error('Redis connection error:', err);
});
