import connectDB from "@/config/db";
import User from "@/models/userModel";
import { headers } from "next/headers";
import { Webhook } from "svix";

export async function POST(req) {
    try {
        const wh = new Webhook(process.env.SIGNING_SECRET);
        const headerPayload = headers();

        // Extract required headers correctly
        const svixHeaders = {
            "svix-id": headerPayload.get("svix-id"),
            "svix-timestamp": headerPayload.get("svix-timestamp"),
            "svix-signature": headerPayload.get("svix-signature"),
        };

        // Check for missing headers
        if (!svixHeaders["svix-id"] || !svixHeaders["svix-timestamp"] || !svixHeaders["svix-signature"]) {
            return Response.json({ error: "Missing required headers" }, { status: 400 });
        }

        // Get raw body (use text, not json)
        const body = await req.text();

        // Verify the webhook
        const { data, type } = wh.verify(body, svixHeaders);

        // Ensure data exists before accessing properties
        if (!data) {
            return Response.json({ error: "Invalid data structure" }, { status: 400 });
        }

        // Prepare the user data safely
        const userData = {
            _id: data.id || "",
            email: data.email_addresses?.[0]?.email_address || "", // Safe access using optional chaining
            name: `${data.first_name || ""} ${data.last_name || ""}`.trim(), // Ensure name is valid
            image: data.image_url || "",
        };

        // Connect to database
        await connectDB();

        // Handle different webhook event types
        switch (type) {
            case "user.created":
                await User.create(userData);
                break;
            case "user.updated":
                await User.findByIdAndUpdate(data.id, userData);
                break;
            case "user.deleted":
                await User.findByIdAndDelete(data.id);
                break;
            default:
                console.log(`Unhandled event type: ${type}`);
        }

        return Response.json({ message: "Event received successfully" });

    } catch (error) {
        console.error("Webhook processing error:", error);
        return Response.json({ error: "Webhook verification failed" }, { status: 400 });
    }
}
