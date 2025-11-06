import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connect } from "@/dbconfig/dbconfig";
import User from "@/models/userModel";
import redis from '@/lib/redis';

connect();

export async function GET(request: NextRequest) {
    const token = request.cookies.get("token")?.value || "";

    if (!token) {
        return NextResponse.json({
            message: "No token found",
            success: false
        }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as { id: string };
        const userId = decoded.id;
        
       
        const cachedUser = await redis.get(`user_${userId}`);
        
        if (cachedUser) {
            const user = JSON.parse(cachedUser);
            console.log("Redis cache hit");
            return NextResponse.json({
                message: "User found (from cache)",
                success: true,
                user: {
                    cacheStatus: "hit",
                    username: user.username,
                    email: user.email,
                    id: user._id
                }
            });
        }
        
        // Cache Miss
        const user = await User.findById(userId).select("-password");
       
        if (!user) {
            return NextResponse.json({
                message: "User not found (in DB)",
                success: false
            }, { status: 404 });
        }
        console.log("Redis cache miss");
        return NextResponse.json({
            message: "User found (from DB)",
            success: true,
            user: {
                username: user.username,
                email: user.email,
                id: user._id,
                cacheStatus: "miss"

            }
        });

    } catch (error: any) {
  
        console.error("Authentication error:", error.message);
        return NextResponse.json({ error: "Invalid or expired token. Please log in again." }, { status: 401 });
    }
}