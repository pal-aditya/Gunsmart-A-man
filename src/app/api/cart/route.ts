import { redis } from '@/lib/redis';
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/dbconfig";
import User from "@/models/userModel";
import jwt from "jsonwebtoken";
import Data from "@/app/mainpage/Data";
let reqBody: any;
connect();

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Please login first" }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as { id: string };
    reqBody = await request.json();

    let userInDatabase = await User.findById(decoded.id);

    if (!userInDatabase) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let count = 0;
    let indexing: any;

    userInDatabase.idProduct.forEach((element: any, index: any) => {
      if (element == reqBody) {
        indexing = index;
        count++;
      }
    });

    if (count === 0) {
      await User.findByIdAndUpdate(
        decoded.id,
        { $push: { idProduct: reqBody, Quantity: 1 } }
      );

      return NextResponse.json({
        message: "Item added to cart",
        success: true
      });
    }

    if (count !== 0) {
      await User.findByIdAndUpdate(
        decoded.id,
        { $set: { [`Quantity.${indexing}`]: +userInDatabase.Quantity[indexing] + 1 } }
      );

      return NextResponse.json({
        message: "Item quantity updated",
        success: true
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("token")?.value;
        
        if (!token) {
            return NextResponse.json({ error: "Please login first" }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as { id: string };
        const userFromDatabase = await User.findById(decoded.id);

        if (!userFromDatabase) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
    const consolidatedCart = userFromDatabase.idProduct.reduce((acc: any, cardId: string, index: number) => {
      if (!acc[cardId]) {
        const item = Data.find((item: any) => Number(item.id) === Number(cardId));
        if (item) {
          acc[cardId] = { ...item, quantity: 0 };
        }
      }
      if (acc[cardId]) {
        acc[cardId].quantity += Number(userFromDatabase.Quantity[index]) || 0;
      }
      return acc;
    }, {});

    let sortedData:any = Object.values(consolidatedCart);

        let salePriceTotal = 0;
        let retailPriceTotal = 0;

        for (let i = 0; i < sortedData.length; i++) {
            const quantity = Number(sortedData[i].quantity) || 0;
            const salePrice = Number((sortedData[i].salePrice || "").toString().substring(1)) || 0;
            const retailPrice = Number((sortedData[i].retailPrice || "").toString().substring(1)) || 0;
            
            salePriceTotal += quantity * salePrice;
            retailPriceTotal += quantity * retailPrice;
        }
        
        salePriceTotal = Number(salePriceTotal.toFixed(2));
        retailPriceTotal = Number(retailPriceTotal.toFixed(2));
        
        return NextResponse.json({
            message: "Cart data retrieved successfully",
            success: true,
            data: sortedData,
            salePriceTotal,
            retailPriceTotal
        });
    } catch (error: any) {
        return NextResponse.json({error: error.message}, {status: 500})
    }
}
