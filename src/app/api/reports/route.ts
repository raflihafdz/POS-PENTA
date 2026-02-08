import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const groupBy = searchParams.get("groupBy") || "day"; // day, week, month

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate + "T23:59:59.999Z"),
        },
      };
    }

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: dateFilter,
      include: {
        transactionItems: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Get summary stats
    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum: number, t: { totalAmount: number }) => sum + t.totalAmount, 0);
    const totalItems = transactions.reduce(
      (sum: number, t: { transactionItems: { quantity: number }[] }) => sum + t.transactionItems.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0),
      0
    );

    // Group by date
    const groupedData: Record<string, { date: string; totalTransactions: number; totalAmount: number; totalItems: number }> = {};

    transactions.forEach((transaction: { createdAt: Date; totalAmount: number; transactionItems: { quantity: number }[] }) => {
      let dateKey: string;
      const date = new Date(transaction.createdAt);

      if (groupBy === "month") {
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      } else if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        dateKey = weekStart.toISOString().split("T")[0];
      } else {
        dateKey = date.toISOString().split("T")[0];
      }

      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          totalTransactions: 0,
          totalAmount: 0,
          totalItems: 0,
        };
      }

      groupedData[dateKey].totalTransactions += 1;
      groupedData[dateKey].totalAmount += transaction.totalAmount;
      groupedData[dateKey].totalItems += transaction.transactionItems.reduce(
        (sum: number, item: { quantity: number }) => sum + item.quantity,
        0
      );
    });

    // Get top selling products
    const productSales = await prisma.transactionItem.groupBy({
      by: ["productId"],
      where: {
        transaction: dateFilter,
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 10,
    });

    // Batch fetch all products (avoid N+1 query)
    const productIds = productSales.map((ps: any) => ps.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    const topProducts = productSales
      .map((ps: any) => ({
        product: productMap.get(ps.productId),
        totalQuantity: ps._sum.quantity,
        totalAmount: ps._sum.subtotal,
      }))
      .filter((item: any) => item.product); // Filter out missing products

    return NextResponse.json({
      summary: {
        totalTransactions,
        totalAmount,
        totalItems,
      },
      dailyData: Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date)),
      topProducts,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
