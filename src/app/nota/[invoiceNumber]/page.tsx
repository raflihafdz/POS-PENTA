"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui";

interface NotaItem {
  name: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
  unit: string;
}

interface NotaData {
  invoiceNumber: string;
  createdAt: string;
  cashierName: string;
  paymentMethod: string;
  totalAmount: number;
  paymentAmount: number;
  changeAmount: number;
  items: NotaItem[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function NotaPage() {
  const params = useParams();
  const invoiceNumber = params.invoiceNumber as string;
  const [nota, setNota] = useState<NotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const notaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNota();
  }, [invoiceNumber]);

  const fetchNota = async () => {
    try {
      const res = await fetch(`/api/nota/${invoiceNumber}`);
      if (res.ok) {
        const data = await res.json();
        setNota(data);
      } else {
        setError("Nota tidak ditemukan");
      }
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const downloadAsImage = async () => {
    if (!notaRef.current) return;
    
    setDownloading(true);
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import("html2canvas")).default;
      
      const canvas = await html2canvas(notaRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      
      const link = document.createElement("a");
      link.download = `nota-${invoiceNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Error downloading:", err);
      alert("Gagal mengunduh nota");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-900">Memuat nota...</div>
      </div>
    );
  }

  if (error || !nota) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <p className="text-6xl mb-4">🔍</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Nota Tidak Ditemukan</h1>
          <p className="text-gray-900">{error || "Nota yang Anda cari tidak tersedia"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Tombol Download */}
        <div className="mb-4 flex justify-center">
          <Button
            onClick={downloadAsImage}
            disabled={downloading}
            className="bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-2"
          >
            {downloading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Mengunduh...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Nota
              </>
            )}
          </Button>
        </div>

        {/* Nota Card - Using inline styles for html2canvas compatibility */}
        <div
          ref={notaRef}
          style={{ backgroundColor: "#ffffff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}
        >
          {/* Header */}
          <div style={{ background: "linear-gradient(to right, #f43f5e, #e11d48)", color: "#ffffff", padding: "24px", textAlign: "center" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "4px" }}>🧾 POS PENTA</h1>
            <p style={{ color: "#fecdd3", fontSize: "14px" }}>Nota Pembelian Digital</p>
          </div>

          {/* Info Transaksi */}
          <div style={{ padding: "24px", borderBottom: "2px dashed #d1d5db" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px" }}>
              <div>
                <p style={{ color: "#6b7280" }}>No. Invoice</p>
                <p style={{ fontFamily: "monospace", fontWeight: "bold", color: "#111827" }}>{nota.invoiceNumber}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "#6b7280" }}>Tanggal</p>
                <p style={{ fontWeight: "500", color: "#111827" }}>{formatDate(nota.createdAt)}</p>
              </div>
              <div>
                <p style={{ color: "#6b7280" }}>Kasir</p>
                <p style={{ fontWeight: "500", color: "#111827" }}>{nota.cashierName}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "#6b7280" }}>Metode Bayar</p>
                <p style={{ fontWeight: "500", color: "#111827" }}>{nota.paymentMethod}</p>
              </div>
            </div>
          </div>

          {/* Daftar Belanja */}
          <div style={{ padding: "24px", borderBottom: "2px dashed #d1d5db" }}>
            <h3 style={{ fontWeight: "bold", color: "#111827", marginBottom: "16px" }}>Daftar Belanja</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {nota.items.map((item, index) => (
                <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "500", color: "#111827" }}>{item.name}</p>
                    <p style={{ fontSize: "14px", color: "#6b7280" }}>
                      {item.quantity} {item.unit} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p style={{ fontWeight: "600", color: "#111827" }}>{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div style={{ padding: "24px", backgroundColor: "#f9fafb" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#111827" }}>
                <span>Subtotal</span>
                <span>{formatCurrency(nota.totalAmount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#111827" }}>
                <span>Bayar</span>
                <span>{formatCurrency(nota.paymentAmount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#111827" }}>
                <span>Kembali</span>
                <span>{formatCurrency(nota.changeAmount)}</span>
              </div>
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "8px", marginTop: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "bold" }}>
                  <span style={{ color: "#111827" }}>TOTAL</span>
                  <span style={{ color: "#e11d48" }}>{formatCurrency(nota.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "24px", textAlign: "center", backgroundColor: "#f3f4f6" }}>
            <p style={{ color: "#4b5563", fontSize: "14px" }}>✨ Terima kasih atas kunjungan Anda!</p>
            <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px" }}>Semoga hari Anda menyenangkan 🙏</p>
          </div>
        </div>

        {/* Watermark */}
        <p className="text-center text-gray-400 text-xs mt-4">
          Nota digital dari POS PENTA
        </p>
      </div>
    </div>
  );
}
