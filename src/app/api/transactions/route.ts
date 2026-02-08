import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/utils";

// GET all transactions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");

    const whereClause: {
      createdAt?: { gte?: Date; lte?: Date };
      userId?: string;
    } = {};

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + "T23:59:59.999Z"),
      };
    }

    // Kasir can only see their own transactions
    if (session.user.role === "KASIR") {
      whereClause.userId = session.user.id;
    } else if (userId) {
      whereClause.userId = userId;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        transactionItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST create transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, paymentAmount, paymentMethod } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Keranjang kosong" }, { status: 400 });
    }

    // Get all products in one query (avoid N+1)
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    // Calculate total
    let totalAmount = 0;
    const transactionItems = [];

    for (const item of items) {
      const product = productMap.get(item.productId) as any;

      if (!product) {
        return NextResponse.json(
          { error: `Produk dengan ID ${item.productId} tidak ditemukan` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stok ${product.name} tidak mencukupi` },
          { status: 400 }
        );
      }

      // Determine price based on priceType sent from kasir
      // priceType: "RETAIL" (eceran) or "WHOLESALE" (grosir)
      let price = product.sellPrice;
      if (item.priceType === "WHOLESALE" && product.sellPriceWholesale) {
        price = product.sellPriceWholesale;
      }

      const subtotal = price * item.quantity;
      totalAmount += subtotal;

      transactionItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: price,
        subtotal,
      });
    }

    if (paymentAmount < totalAmount) {
      return NextResponse.json(
        { error: "Jumlah pembayaran kurang dari total" },
        { status: 400 }
      );
    }

    const changeAmount = paymentAmount - totalAmount;

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        totalAmount,
        paymentAmount,
        changeAmount,
        paymentMethod: paymentMethod || "CASH",
        userId: session.user.id,
        transactionItems: {
          create: transactionItems,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        transactionItems: {
          include: {
            product: true,
          },
        },
      },
    });

    // Update stock and create stock history in parallel for all items
    const stockUpdates = items.map((item: any) =>
      prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })
    );

    const stockHistoryCreates = items.map((item: any) =>
      prisma.stockHistory.create({
        data: {
          productId: item.productId,
          type: "OUT",
          quantity: item.quantity,
          note: `Penjualan - ${transaction.invoiceNumber}`,
          userId: session.user.id,
        },
      })
    );

    // Execute all updates in parallel
    await Promise.all([...stockUpdates, ...stockHistoryCreates]);

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
