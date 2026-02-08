"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types";

interface DashboardData {
  totalProducts: number;
  lowStockProducts: number;
  todayTransactions: number;
  todayRevenue: number;
  totalKasir: number;
}

interface ExpiringProduct {
  product: Product;
  daysUntilExpiry: number;
  isExpired: boolean;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [expiringProducts, setExpiringProducts] = useState<ExpiringProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchExpiringProducts();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const dashboardRes = await fetch("/api/dashboard");
      const dashboardData = await dashboardRes.json();

      setData(dashboardData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiringProducts = async () => {
    try {
      const res = await fetch("/api/products/expiring");
      if (res.ok) {
        const data = await res.json();
        setExpiringProducts(data || []);
      }
    } catch (error) {
      console.error("Error fetching expiring products:", error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-900">Memuat data...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900">
                Total Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {data?.totalProducts || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900">
                Stok Rendah
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                {data?.lowStockProducts || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900">
                Transaksi Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {data?.todayTransactions || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900">
                Pendapatan Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(data?.todayRevenue || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Expiry Warning Section */}
        {expiringProducts.length > 0 && (
          <Card className="border-yellow-300 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <span className="text-2xl">⚠️</span>
                Peringatan Kadaluarsa ({expiringProducts.length} Produk)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-auto">
                {expiringProducts.map((item) => (
                  <div 
                    key={item.product.id} 
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      item.isExpired ? "bg-red-100 border border-red-300" : "bg-yellow-100 border border-yellow-300"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-900">{item.product.sku}</p>
                    </div>
                    <div className="text-right">
                      {item.isExpired ? (
                        <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
                          KADALUARSA
                        </span>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          item.daysUntilExpiry <= 7 
                            ? "bg-orange-500 text-white" 
                            : "bg-yellow-500 text-white"
                        }`}>
                          {item.daysUntilExpiry} hari lagi
                        </span>
                      )}
                      <p className="text-xs text-gray-900 mt-1">
                        {item.product.expiryDate && new Date(item.product.expiryDate).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <a href="/admin/products">
                  <Button variant="secondary" className="w-full">
                    Lihat Semua Produk
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-900">Jumlah Kasir Aktif</span>
                  <span className="font-semibold text-gray-900">{data?.totalKasir || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-900">Produk dengan Stok Rendah</span>
                  <span className="font-semibold text-red-600">{data?.lowStockProducts || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-900">Produk Mendekati Kadaluarsa</span>
                  <span className="font-semibold text-yellow-600">{expiringProducts.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="/admin/products"
                  className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors"
                >
                  <span className="text-2xl">📦</span>
                  <p className="mt-2 text-sm font-medium text-blue-700">Kelola Produk</p>
                </a>
                <a
                  href="/admin/stock"
                  className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors"
                >
                  <span className="text-2xl">📋</span>
                  <p className="mt-2 text-sm font-medium text-green-700">Tambah Stok</p>
                </a>
                <a
                  href="/admin/users"
                  className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors"
                >
                  <span className="text-2xl">👥</span>
                  <p className="mt-2 text-sm font-medium text-purple-700">Kelola Kasir</p>
                </a>
                <a
                  href="/admin/reports"
                  className="p-4 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100 transition-colors"
                >
                  <span className="text-2xl">📈</span>
                  <p className="mt-2 text-sm font-medium text-yellow-700">Lihat Laporan</p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
