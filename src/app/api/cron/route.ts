import { NextResponse } from 'next/server';
import { sendDailyBoardNotification } from '../../submit/actions'; // Adjust path

export async function GET(request: Request) {
    // Check Authorization
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // Calculate the board number based on your 22:00 UTC reset
        const now = new Date();
        const start = new Date("2024-12-25T22:00:00Z"); // Your project start date
        const diff = now.getTime() - start.getTime();
        const boardNumber = Math.floor(diff / (1000 * 60 * 60 * 24));

        await sendDailyBoardNotification(boardNumber+1);

        return NextResponse.json({
            success: true,
            message: `Notification sent for board ${boardNumber}`
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}