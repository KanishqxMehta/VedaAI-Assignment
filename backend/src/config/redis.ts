import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const redisConnection = new IORedis(process.env.REDIS_URI || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

redisConnection.on('error', (err) => {
    console.error('Redis connection error:', err);
});
