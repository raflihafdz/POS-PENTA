import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET all products
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const products = await prisma.product.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
            ],
          },
          categoryId ? { categoryId } : {},
          activeOnly ? { isActive: true } : {},
        ],
      },
      include: {
        category: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST create product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, sku, description, buyPrice, sellPrice, 
      sellPriceWholesale, wholesaleMinQty, unit, unitWholesale, unitConversion,
      stock, minStock, categoryId, expiryDate, expiryAlertDays, jualKiloan 
    } = body;

    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      return NextResponse.json({ error: "SKU sudah digunakan" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description,
        buyPrice: parseFloat(buyPrice) || 0,
        sellPrice: parseFloat(sellPrice),
        sellPriceWholesale: sellPriceWholesale ? parseFloat(sellPriceWholesale) : null,
        wholesaleMinQty: parseInt(wholesaleMinQty) || 1,
        unit: unit || "pcs",
        unitWholesale: unitWholesale || null,
        unitConversion: parseFloat(unitConversion) || 1,
        jualKiloan: jualKiloan || false,
        stock: parseFloat(stock) || 0,
        minStock: parseInt(minStock) || 5,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        expiryAlertDays: parseInt(expiryAlertDays) || 30,
        categoryId: categoryId || null,
      },
      include: {
        category: true,
      },
    });

    // Create stock history for initial stock
    if (stock > 0) {
      await prisma.stockHistory.create({
        data: {
          productId: product.id,
          type: "IN",
          quantity: parseFloat(stock),
          note: "Stok awal",
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
