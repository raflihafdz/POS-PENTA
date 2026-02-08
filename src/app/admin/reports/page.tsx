"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Input, Card, CardContent, CardHeader, CardTitle, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from "@/components/ui";
import { formatCurrency, formatDateOnly } from "@/lib/utils";

interface ReportData {
  summary: {
    totalTransactions: number;
    totalAmount: number;
    totalItems: number;
  };
  dailyData: {
    date: string;
    totalTransactions: number;
    totalAmount: number;
    totalItems: number;
  }[];
  topProducts: {
    product: { id: string; name: string; sku: string };
    totalQuantity: number;
    totalAmount: number;
  }[];
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [groupBy, setGroupBy] = useState("day");
  const [dailyPage, setDailyPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, groupBy]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("startDate", startDate);
      params.append("endDate", endDate);
      params.append("groupBy", groupBy);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic for daily data
  const dailyData = reportData?.dailyData || [];
  const dailyTotalPages = Math.ceil(dailyData.length / itemsPerPage);
  const paginatedDailyData = dailyData.slice(
    (dailyPage - 1) * itemsPerPage,
    dailyPage * itemsPerPage
  );

  // Pagination logic for top products
  const topProducts = reportData?.topProducts || [];
  const productsTotalPages = Math.ceil(topProducts.length / itemsPerPage);
  const paginatedProducts = topProducts.slice(
    (productsPage - 1) * itemsPerPage,
    productsPage * itemsPerPage
  );

  // Reset pages when filters change
  useEffect(() => {
    setDailyPage(1);
    setProductsPage(1);
  }, [startDate, endDate, groupBy]);

  if (loading && !reportData) {
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
        <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>

        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Input
                label="Tanggal Mulai"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="Tanggal Akhir"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Select
                label="Grup Berdasarkan"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                options={[
                  { value: "day", label: "Harian" },
                  { value: "week", label: "Mingguan" },
                  { value: "month", label: "Bulanan" },
                ]}
              />
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-900">Total Transaksi</p>
              <p className="text-3xl font-bold text-gray-900">{reportData?.summary.totalTransactions || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-900">Total Pendapatan</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(reportData?.summary.totalAmount || 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-900">Total Item Terjual</p>
              <p className="text-3xl font-bold text-gray-900">{reportData?.summary.totalItems || 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Penjualan per Periode</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Transaksi</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Pendapatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDailyData.map((data) => (
                    <TableRow key={data.date}>
                      <TableCell>{formatDateOnly(data.date)}</TableCell>
                      <TableCell>{data.totalTransactions}</TableCell>
                      <TableCell>{data.totalItems}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(data.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                  {paginatedDailyData.length === 0 && (
                    <TableRow>
                      <TableCell className="text-center text-gray-900 py-8" colSpan={4}>
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination for daily data */}
              {dailyData.length > 0 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={dailyPage}
                    totalPages={dailyTotalPages}
                    totalItems={dailyData.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setDailyPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produk Terlaris</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Terjual</TableHead>
                    <TableHead>Pendapatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((item, index) => (
                    <TableRow key={item.product?.id || index}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-gray-900">{item.product?.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.totalQuantity}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(item.totalAmount || 0)}</TableCell>
                    </TableRow>
                  ))}
                  {paginatedProducts.length === 0 && (
                    <TableRow>
                      <TableCell className="text-center text-gray-900 py-8" colSpan={3}>
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination for top products */}
              {topProducts.length > 0 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={productsPage}
                    totalPages={productsTotalPages}
                    totalItems={topProducts.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setProductsPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
