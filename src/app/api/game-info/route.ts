import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Explicitly point to the variable names Vercel created for you
const redis = new Redis({
    url: process.env.STORAGE_KV_REST_API_URL,
    token: process.env.STORAGE_KV_REST_API_TOKEN,
});

export async function GET() {
    try {
        const now = new Date();
        const startDate = new Date('2026-04-19T00:00:00Z');

        const diffTime = now.getTime() - startDate.getTime();
        const boardNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Fetch the solve count
        const solveCount = await redis.get(`solves:board:${boardNumber}`) || 0;

        return NextResponse.json({
            boardNumber,
            solveCount,
        });
    } catch (error) {
        console.error("Redis Error:", error);
        return NextResponse.json({ error: "Failed to fetch game info" }, { status: 500 });
    }
}