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

    const today = new Date().toISOString().split("T")[0];
    const startOfDay = new Date(today + "T00:00:00.000Z");
    const endOfDay = new Date(today + "T23:59:59.999Z");

    // Use parallel queries for better performance
    const [
      totalProducts,
      lowStockProducts,
      todayTransactions,
      totalKasir,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          stock: true,
          minStock: true,
        },
      }),
      prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          totalAmount: true,
        },
      }),
      prisma.user.count({ where: { role: "KASIR" } }),
    ]);

    // Filter products with low stock on client
    const lowStockCount = lowStockProducts.filter(
      (p: any) => p.stock <= p.minStock
    ).length;

    const todayRevenue = todayTransactions.reduce(
      (sum: number, t: any) => sum + t.totalAmount,
      0
    );

    return NextResponse.json({
      totalProducts,
      lowStockProducts: lowStockCount,
      todayTransactions: todayTransactions.length,
      todayRevenue,
      totalKasir,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
