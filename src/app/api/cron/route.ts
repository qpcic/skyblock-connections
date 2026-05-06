import { NextResponse } from 'next/server';
import { getDailyPuzzle } from '../../../lib/gameLogic'; // Double check this path!

export async function GET(request: Request) {
    // 1. Safety Check: Only Vercel Crons should call this
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Get the Board Number
    // Since we want to ping for the board that just became active
    // We can calculate it based on your logic
    const now = new Date();

    // Logic to match your 22:00 UTC (Midnight Slovenia) reset
    const start = new Date("2025-12-25T22:00:00Z");
    const diff = now.getTime() - start.getTime();
    const boardNumber = Math.floor(diff / (1000 * 60 * 60 * 24));

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        return new NextResponse('Missing DISCORD_WEBHOOK_URL', { status: 500 });
    }

    const message = {
        content: `# 🧩 New Connections Board!\n@everyone **Board #${boardNumber}** is now live!\n\n**Play here:** https://skyblock-connections.com/`,
    };

    try {
        const discordRes = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });

        if (!discordRes.ok) throw new Error('Discord rejected the message');

        return NextResponse.json({ success: true, board: boardNumber });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}