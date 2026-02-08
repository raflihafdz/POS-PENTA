"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const adminMenuItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Produk", icon: "📦" },
  { href: "/admin/categories", label: "Kategori", icon: "🏷️" },
  { href: "/admin/stock", label: "Stok & Harga", icon: "📋" },
  { href: "/admin/stock-history", label: "Riwayat Stok", icon: "📜" },
  { href: "/admin/users", label: "Manajemen Kasir", icon: "👥" },
  { href: "/admin/transactions", label: "Riwayat Transaksi", icon: "🧾" },
  { href: "/admin/reports", label: "Laporan Penjualan", icon: "📈" },
];

const kasirMenuItems = [
  { href: "/kasir", label: "POS", icon: "🛒" },
  { href: "/kasir/history", label: "Riwayat Transaksi", icon: "🧾" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";
  const menuItems = isAdmin ? adminMenuItems : kasirMenuItems;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-rose-500 text-white rounded-xl shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-72 lg:w-64 bg-linear-to-b from-rose-600 to-rose-700 text-white min-h-screen flex flex-col transform transition-transform duration-300 ease-in-out shadow-2xl",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-5 border-b border-rose-500/50">
          <h1 className="text-2xl font-bold tracking-tight">POS PENTA</h1>
          <p className="text-sm text-rose-200 mt-1">
            {isAdmin ? "👑 Administrator" : "💼 Kasir"}
          </p>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1.5">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    pathname === item.href
                      ? "bg-white text-rose-600 shadow-lg font-semibold"
                      : "text-rose-100 hover:bg-rose-500/50"
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-rose-500/50 bg-rose-700/50">
          <div className="mb-3 px-2">
            <p className="font-medium text-white">{session?.user?.name}</p>
            <p className="text-xs text-rose-200">{session?.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <span>🚪</span>
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
