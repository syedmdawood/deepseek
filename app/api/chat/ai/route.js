export const maxDuration = 60;
import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI API client with deepseek api key and base url
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});

export async function POST(req) {
    try {
        const { userId } = getAuth(req)

        // extract chat id and prompt form the req body
        const { chatId, prompt } = await req.json()
        if (!userId) {
            return NextResponse.json({ success: false, message: "User not authenticated" })
        }
        // find the chat in the dattabse based on the usedID and chatId
        await connectDB()
        const data = await Chat.findOne({ userId, _id: chatId })

        // create a message object
        const userPrompt = {
            role: "user",
            content: prompt,
            timestamp: Date.now()
        }

        data.messages.push(userPrompt)

        //call the deepseep api to get chat completion
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "deepseek-chat",
            store: true,
        });

        const message = completion.choices[0].message;
        message.timestamp = Date.now()
        data.messages.push(message)
        data.save()
        return NextResponse.json({ success: true, data: message })
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message })
    }
}

