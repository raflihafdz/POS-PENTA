import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface TransactionItemWithProduct {
  quantity: number;
  price: number;
  subtotal: number;
  product: {
    name: string;
    sku: string;
    unit: string;
    unitWholesale: string | null;
  } | null;
}

// API publik untuk mengambil detail nota berdasarkan invoice number
// Tidak memerlukan autentikasi agar pelanggan bisa akses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    const { invoiceNumber } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { invoiceNumber },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        transactionItems: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                unit: true,
                unitWholesale: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Nota tidak ditemukan" },
        { status: 404 }
      );
    }

    // Return data nota
    return NextResponse.json({
      invoiceNumber: transaction.invoiceNumber,
      createdAt: transaction.createdAt,
      cashierName: transaction.user?.name || "Kasir",
      paymentMethod: transaction.paymentMethod,
      totalAmount: transaction.totalAmount,
      paymentAmount: transaction.paymentAmount,
      changeAmount: transaction.changeAmount,
      items: transaction.transactionItems.map((item: TransactionItemWithProduct) => ({
        name: item.product?.name || "Produk",
        sku: item.product?.sku || "",
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        unit: item.product?.unit || "pcs",
      })),
    });
  } catch (error) {
    console.error("Error fetching nota:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
