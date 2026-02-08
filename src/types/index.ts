export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  buyPrice: number;
  sellPrice: number;
  sellPriceWholesale?: number;
  wholesaleMinQty: number;
  unit: string;
  unitWholesale?: string;
  unitConversion: number;
  jualKiloan: boolean;
  stock: number;
  minStock: number;
  expiryDate?: Date | string;
  expiryAlertDays: number;
  categoryId?: string;
  category?: Category;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "KASIR";
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paymentAmount: number;
  changeAmount: number;
  paymentMethod: string;
  userId: string;
  user?: User;
  transactionItems?: TransactionItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  subtotal: number;
  priceType: "RETAIL" | "WHOLESALE";
  unit: string;
}

export interface StockHistory {
  id: string;
  productId: string;
  product?: Product;
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  note?: string;
  userId: string;
  user?: User;
  createdAt: Date;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
  priceType: "RETAIL" | "WHOLESALE";
  unit: string;
}

export interface SalesReport {
  date: string;
  totalTransactions: number;
  totalAmount: number;
  totalItems: number;
}

export interface ExpiringProduct {
  product: Product;
  daysUntilExpiry: number;
}
