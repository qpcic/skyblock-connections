// app/submit/actions.ts
"use server";

export async function sendToDiscord(data: any) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error("Webhook URL is not defined in environment variables.");
        return { success: false };
    }

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: `**New Suggestion!**\n**Category:** ${data.category}\n**Words:** ${data.words.join(", ")}\n**Author:** ${data.author || "Anonymous"}`,
            }),
        });

        return { success: response.ok };
    } catch (error) {
        console.error(error);
        return { success: false };
    }
}