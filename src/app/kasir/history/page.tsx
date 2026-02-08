"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Input, Card, CardContent, CardHeader, CardTitle, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button, Pagination } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Transaction } from "@/types";

export default function KasirHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate]);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalToday = transactions.reduce((sum, t) => sum + t.totalAmount, 0);

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

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
        <h1 className="text-2xl font-bold text-gray-900">Riwayat Transaksi Saya</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-900">Total Transaksi</p>
              <p className="text-3xl font-bold text-gray-900">{transactions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-900">Total Penjualan</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(totalToday)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Metode Bayar</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono">{transaction.invoiceNumber}</TableCell>
                    <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                    <TableCell>{transaction.paymentMethod}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(transaction.totalAmount)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedTransaction(transaction)}>
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell className="text-center text-gray-900 py-8" colSpan={5}>
                      Tidak ada transaksi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          
          {/* Pagination */}
          {transactions.length > 0 && (
            <div className="px-6 pb-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={transactions.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title={`Detail Transaksi - ${selectedTransaction?.invoiceNumber}`}
        size="lg"
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-900">Tanggal</p>
                <p className="font-medium">{formatDate(selectedTransaction.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-900">Metode Pembayaran</p>
                <p className="font-medium">{selectedTransaction.paymentMethod}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 text-gray-900">Item</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTransaction.transactionItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product?.name}</TableCell>
                      <TableCell>{formatCurrency(item.price)}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-gray-900">
                <span>Total</span>
                <span className="font-bold text-gray-900">{formatCurrency(selectedTransaction.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-900">
                <span>Bayar</span>
                <span className="text-gray-900">{formatCurrency(selectedTransaction.paymentAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-900">
                <span>Kembalian</span>
                <span className="text-gray-900">{formatCurrency(selectedTransaction.changeAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
