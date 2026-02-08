"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Input, Card, CardContent, CardHeader, CardTitle, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { StockHistory } from "@/types";

export default function StockHistoryPage() {
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStockHistory();
  }, [filterType, startDate, endDate]);

  const fetchStockHistory = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType) params.append("type", filterType);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      params.append("page", currentPage.toString());
      params.append("pageSize", itemsPerPage.toString());

      const res = await fetch(`/api/stock?${params.toString()}`);
      const result = await res.json();
      
      if (result.data) {
        setStockHistory(result.data);
        setTotalPages(result.pagination.totalPages);
      } else {
        setStockHistory(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.error("Error fetching stock history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "IN":
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Masuk</span>;
      case "OUT":
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Keluar</span>;
      case "ADJUSTMENT":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Penyesuaian</span>;
      default:
        return type;
    }
  };

  // Pagination already handled by API
  // No need to paginate on client side anymore

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, startDate, endDate]);

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
        <h1 className="text-2xl font-bold text-gray-900">Riwayat Stok</h1>

        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Select
                label="Tipe"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                options={[
                  { value: "", label: "Semua Tipe" },
                  { value: "IN", label: "Barang Masuk" },
                  { value: "OUT", label: "Barang Keluar" },
                  { value: "ADJUSTMENT", label: "Penyesuaian" },
                ]}
              />
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
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockHistory.map((history: any) => (
                  <TableRow key={history.id}>
                    <TableCell>{formatDate(history.createdAt)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{history.product?.name}</p>
                        <p className="text-sm text-gray-900">{history.product?.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeLabel(history.type)}</TableCell>
                    <TableCell>
                      <span className={history.type === "IN" ? "text-green-600" : history.type === "OUT" ? "text-red-600" : ""}>
                        {history.type === "IN" ? "+" : history.type === "OUT" ? "-" : ""}
                        {Math.abs(history.quantity)}
                      </span>
                    </TableCell>
                    <TableCell>{history.note || "-"}</TableCell>
                    <TableCell>{history.user?.name}</TableCell>
                  </TableRow>
                ))}
                {stockHistory.length === 0 && (
                  <TableRow>
                    <TableCell className="text-center text-gray-900 py-8" colSpan={6}>
                      Tidak ada riwayat stok
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          
          {/* Pagination */}
          {stockHistory.length > 0 && (
            <div className="px-6 pb-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={stockHistory.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
