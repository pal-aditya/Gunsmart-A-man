import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/dbconfig";
import User from "@/models/userModel";
import jwt from "jsonwebtoken";
import redis from "@/lib/redis";

connect();

export async function POST(request: NextRequest){
    try {
        const token = request.cookies.get("token")?.value;
    
        if (!token) {
            return NextResponse.json({ error: "Please login first" }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as { id: string };
        const reqBody = await request.json();

        const cacheKey = `cart:${decoded.id}`;
        let userInDatabase;
        let cacheHit = false;
        
        if (reqBody.remove || reqBody.skipCache) {
          userInDatabase = await User.findById(decoded.id);
          if (!userInDatabase) {
              return NextResponse.json({ error: "User not found" }, { status: 404 });
          }
          await redis.del(cacheKey);
        } else {
          const cachedCart = await redis.get(cacheKey);
          if (cachedCart) {
            userInDatabase = JSON.parse(cachedCart);
            cacheHit = true;
          } else {
            userInDatabase = await User.findById(decoded.id);
            if (!userInDatabase) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
            await redis.setex(cacheKey, 3600, JSON.stringify(userInDatabase));
          }
        }

        if (!Array.isArray(userInDatabase.idProduct)) userInDatabase.idProduct = [];
        if (!Array.isArray(userInDatabase.Quantity)) userInDatabase.Quantity = [];

        const itemId = reqBody.minus || reqBody.remove;
        if (!itemId) {
          return NextResponse.json({ error: "No item ID provided" }, { status: 400 });
        }

        const itemIdStr = String(itemId);
        const index = userInDatabase.idProduct.findIndex((el: any) => String(el) === itemIdStr);
        if (index === -1) {
          return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
        }

        const currentQty = Number(userInDatabase.Quantity[index] ?? 0);
        
        // If it's a remove operation, remove the item completely
        if (reqBody.remove) {
          await User.findByIdAndUpdate(
            decoded.id,
            { $pull: { idProduct: itemIdStr, Quantity: { $in: [userInDatabase.Quantity[index]] } } }
          );
          
          return NextResponse.json({ 
            message: "Item removed from cart", 
            success: true
          });
        }

        const amount = Number(reqBody.amount ?? 1);
        if (!Number.isFinite(amount) || amount <= 0) {
          return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        if (currentQty <= amount) {
          await User.findByIdAndUpdate(
            decoded.id,
            { $pull: { idProduct: itemIdStr, Quantity: { $in: [userInDatabase.Quantity[index]] } } }
          );
          
          if (!reqBody.skipCache) {
            userInDatabase.idProduct.splice(index, 1);
            userInDatabase.Quantity.splice(index, 1);
            await redis.setex(cacheKey, 3600, JSON.stringify(userInDatabase));
          }
          
          return NextResponse.json({ 
            message: "Item removed from cart", 
            success: true,
            cacheStatus: reqBody.skipCache ? "Cache bypassed" : (cacheHit ? "Cache hit" : "Cache miss")
          });
        }

        await User.findByIdAndUpdate(
          decoded.id,
          { $set: { [`Quantity.${index}`]: currentQty - amount } }
        );

        if (!reqBody.skipCache) {
          userInDatabase.Quantity[index] = currentQty - amount;
          await redis.setex(cacheKey, 3600, JSON.stringify(userInDatabase));
        }

        return NextResponse.json({ 
          message: "Item quantity decreased", 
          success: true,
          cacheStatus: reqBody.skipCache ? "Cache bypassed" : (cacheHit ? "Cache hit" : "Cache miss")
        });
      
    } catch (error: any) {
        return NextResponse.json({error: error.message}, {status: 500})
    }
}