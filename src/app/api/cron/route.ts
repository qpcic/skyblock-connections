import { NextResponse } from 'next/server';
import {sendDailyBoardNotification} from "@/src/app/lib/notifications"; // Double check this path!
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const startDate = new Date('2026-04-18T22:00:00Z');

    const now = new Date();
    // 2. Calculate the difference
    const diffTime = now.getTime() - startDate.getTime();

    // This math will now result in a new day exactly at 00:00 Ljubljana time
    const boardNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    try {
        await sendDailyBoardNotification(boardNumber);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}