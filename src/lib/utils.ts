import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatDateOnly(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV${year}${month}${day}${random}`;
}

export function generateSKU(name: string): string {
  const prefix = name
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .substring(0, 3);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${random}`;
}

// Interface untuk item transaksi nota
interface NotaItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  priceType?: "RETAIL" | "WHOLESALE";
}

interface NotaData {
  invoiceNumber: string;
  storeName: string;
  cashierName: string;
  items: NotaItem[];
  totalAmount: number;
  paymentAmount: number;
  changeAmount: number;
  paymentMethod: string;
  createdAt: Date | string;
}

// Format nota untuk WhatsApp
export function formatNotaWhatsApp(data: NotaData): string {
  const divider = "─".repeat(30);
  const now = new Date(data.createdAt);
  const dateStr = formatDate(now);

  let nota = `🧾 *NOTA PEMBELIAN*\n`;
  nota += `${divider}\n`;
  nota += `📍 *${data.storeName}*\n`;
  nota += `📅 ${dateStr}\n`;
  nota += `🔢 No: ${data.invoiceNumber}\n`;
  nota += `👤 Kasir: ${data.cashierName}\n`;
  nota += `${divider}\n\n`;
  
  nota += `*DAFTAR BELANJA:*\n`;
  data.items.forEach((item, index) => {
    const priceLabel = item.priceType === "WHOLESALE" ? " (Grosir)" : "";
    nota += `${index + 1}. ${item.name}${priceLabel}\n`;
    nota += `   ${item.quantity} x ${formatCurrency(item.price)}\n`;
    nota += `   = ${formatCurrency(item.subtotal)}\n\n`;
  });
  
  nota += `${divider}\n`;
  nota += `💰 *TOTAL: ${formatCurrency(data.totalAmount)}*\n`;
  nota += `💵 Bayar: ${formatCurrency(data.paymentAmount)}\n`;
  nota += `💸 Kembali: ${formatCurrency(data.changeAmount)}\n`;
  nota += `📝 Metode: ${data.paymentMethod}\n`;
  nota += `${divider}\n\n`;
  
  nota += `✨ _Terima kasih atas kunjungan Anda!_\n`;
  nota += `🙏 _Semoga hari Anda menyenangkan_`;
  
  return nota;
}

// Buka WhatsApp dengan pesan nota
export function openWhatsAppWithNota(phoneNumber: string, nota: string): void {
  // Format nomor telepon (hapus karakter non-digit, tambah 62 jika perlu)
  let formattedPhone = phoneNumber.replace(/\D/g, "");
  
  // Jika dimulai dengan 0, ganti dengan 62
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "62" + formattedPhone.substring(1);
  }
  // Jika tidak dimulai dengan 62, tambahkan 62
  else if (!formattedPhone.startsWith("62")) {
    formattedPhone = "62" + formattedPhone;
  }
  
  // Encode pesan untuk URL
  const encodedMessage = encodeURIComponent(nota);
  
  // Buka WhatsApp web/app
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  window.open(whatsappUrl, "_blank");
}
