import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/dbconfig";
import User from "@/models/userModel";
import jwt from "jsonwebtoken";
import redis from "@/lib/redis";

connect();

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Please login first" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as { id: string };
    const cacheKey = `cart:${decoded.id}`;

    await User.findByIdAndUpdate(decoded.id, { $set: { idProduct: [], Quantity: [] } });
    await redis.del(cacheKey);

    return NextResponse.json({
      message: "Cart cleared successfully",
      success: true
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
