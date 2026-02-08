import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface ProductWithCategory {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  buyPrice: number;
  sellPrice: number;
  sellPriceWholesale: number | null;
  wholesaleMinQty: number;
  wholesaleUnit: string | null;
  stock: number;
  minStock: number;
  unit: string;
  expiryDate: Date | null;
  expiryAlertDays: number;
  isActive: boolean;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
  };
}

// GET products nearing expiry
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    
    // Calculate default alert days
    const defaultAlertDays = 30;
    const alertDate = new Date(now.getTime() + defaultAlertDays * 24 * 60 * 60 * 1000);

    // Get products with expiry date within alert period (database-level filtering)
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        expiryDate: {
          not: null,
          lte: alertDate, // Only get products expiring within alert period
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        expiryDate: true,
        expiryAlertDays: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        expiryDate: "asc",
      },
    });

    // Process results on client side
    const expiringProducts = products
      .map((product: any) => {
        if (!product.expiryDate) return null;
        
        const expiryDate = new Date(product.expiryDate);
        const diffTime = expiryDate.getTime() - now.getTime();
        const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          product,
          daysUntilExpiry,
          isExpired: daysUntilExpiry <= 0,
        };
      })
      .filter(Boolean);

    return NextResponse.json(expiringProducts);
  } catch (error) {
    console.error("Error fetching expiring products:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
