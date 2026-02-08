import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { 
      name, sku, description, buyPrice, sellPrice, 
      sellPriceWholesale, wholesaleMinQty, unit, unitWholesale, unitConversion,
      minStock, categoryId, isActive, expiryDate, expiryAlertDays, jualKiloan 
    } = body;

    // Check if SKU already exists for another product
    if (sku) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          sku,
          NOT: { id },
        },
      });

      if (existingProduct) {
        return NextResponse.json({ error: "SKU sudah digunakan" }, { status: 400 });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        description,
        buyPrice: buyPrice !== undefined ? parseFloat(buyPrice) : undefined,
        sellPrice: sellPrice !== undefined ? parseFloat(sellPrice) : undefined,
        sellPriceWholesale: sellPriceWholesale !== undefined ? (sellPriceWholesale ? parseFloat(sellPriceWholesale) : null) : undefined,
        wholesaleMinQty: wholesaleMinQty !== undefined ? parseInt(wholesaleMinQty) : undefined,
        unit: unit || undefined,
        unitWholesale: unitWholesale !== undefined ? (unitWholesale || null) : undefined,
        unitConversion: unitConversion !== undefined ? parseFloat(unitConversion) : undefined,
        jualKiloan: jualKiloan !== undefined ? jualKiloan : undefined,
        minStock: minStock !== undefined ? parseInt(minStock) : undefined,
        expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : undefined,
        expiryAlertDays: expiryAlertDays !== undefined ? parseInt(expiryAlertDays) : undefined,
        categoryId: categoryId || null,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      include: { category: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if product has been used in transactions
    const transactionCount = await prisma.transactionItem.count({
      where: { productId: id },
    });

    if (transactionCount > 0) {
      // Soft delete - product has transaction history
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "Produk dinonaktifkan (memiliki riwayat transaksi)" });
    }

    // Hard delete - no transaction history
    // First delete related stock history
    await prisma.stockHistory.deleteMany({
      where: { productId: id },
    });

    // Then delete the product
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
