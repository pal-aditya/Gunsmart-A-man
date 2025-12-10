import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/dbconfig";
import User from "@/models/userModel";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import redis from "@/lib/redis";
connect();

export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json();
        const { email, password } = reqBody;
        const user = await User.findOne({ email });
        
        if (!user) {
            return NextResponse.json(
                { error: "User does not exist" },
                { status: 400 }
            );
        }

        const validPassword = await bcryptjs.compare(password, user.password);
        if (!validPassword) {
            return NextResponse.json(
                { error: "Invalid password" },
                { status: 400 }
            );
        }

        const tokenData = {
            id: user._id.toString(), 
            username: user.username,
            email: user.email
        };

        const token = jwt.sign(tokenData, process.env.JWT_SECRET_KEY!, { expiresIn: "1d" });

        const userForResponseAndCache = {
            username: user.username,
            email: user.email,
            id: user._id.toString() 
        };

        const response = NextResponse.json({
            message: "Login successful",
            success: true,
            user: userForResponseAndCache 
        });

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 86400 // 1 day
        });
        
     
        await redis.set(`user_token_${user._id}`, token, 'EX', 86400); 
        
        await redis.set(`user_${user._id}`, JSON.stringify(userForResponseAndCache), 'EX', 7200); 
        
        return response;

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}