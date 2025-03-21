import mongoose from "mongoose";

let cached = global.mongoose || { conn: null, promise: null };

export default async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).then((mongoose) => {
            console.log("✅ MongoDB Connected Successfully!");
            return mongoose;
        }).catch((err) => {
            console.error("❌ MongoDB Connection Error:", err);
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        console.log("❌ Error connecting to database:", error);
    }
    return cached.conn;
}
