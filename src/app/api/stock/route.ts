import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET stock history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const productId = searchParams.get("productId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    const whereClause: {
      type?: "IN" | "OUT" | "ADJUSTMENT";
      productId?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

    if (type && (type === "IN" || type === "OUT" || type === "ADJUSTMENT")) {
      whereClause.type = type;
    }

    if (productId) {
      whereClause.productId = productId;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + "T23:59:59.999Z"),
      };
    }

    const [stockHistory, total] = await Promise.all([
      prisma.stockHistory.findMany({
        where: whereClause,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.stockHistory.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      data: stockHistory,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching stock history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST add stock
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, type, quantity, note } = body;

    if (!productId || !type || !quantity) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    // Calculate new stock
    let newStock = product.stock;
    if (type === "IN") {
      newStock += parseInt(quantity);
    } else if (type === "OUT") {
      if (product.stock < parseInt(quantity)) {
        return NextResponse.json({ error: "Stok tidak mencukupi" }, { status: 400 });
      }
      newStock -= parseInt(quantity);
    } else if (type === "ADJUSTMENT") {
      newStock = parseInt(quantity);
    }

    // Update product stock
    await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    // Create stock history
    const stockHistory = await prisma.stockHistory.create({
      data: {
        productId,
        type,
        quantity: type === "ADJUSTMENT" ? parseInt(quantity) - product.stock : parseInt(quantity),
        note,
        userId: session.user.id,
      },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(stockHistory, { status: 201 });
  } catch (error) {
    console.error("Error adding stock:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
