"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Modal, Select } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Product, CartItem, TransactionItem } from "@/types";
import { QRCodeSVG } from "qrcode.react";

type PriceType = "RETAIL" | "WHOLESALE";

export default function KasirPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{
    invoiceNumber: string;
    totalAmount: number;
    paymentAmount: number;
    changeAmount: number;
    items?: TransactionItem[];
    createdAt?: string;
    cashierName?: string;
  } | null>(null);

  // State untuk modal nota QR Code
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);

  // For price selection modal
  const [isPriceSelectOpen, setIsPriceSelectOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPriceType, setSelectedPriceType] = useState<PriceType>("RETAIL");
  const [selectedQuantity, setSelectedQuantity] = useState("1");

  // State untuk mobile cart visibility
  const [isCartVisible, setIsCartVisible] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?activeOnly=true");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data.filter((p: Product) => p.stock > 0) : []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    // If product has wholesale price OR allows decimal, show price selection modal
    if (product.sellPriceWholesale || product.jualKiloan) {
      setSelectedProduct(product);
      setSelectedPriceType("RETAIL");
      setSelectedQuantity(product.jualKiloan ? "1" : "1");
      setIsPriceSelectOpen(true);
      return;
    }

    // Otherwise add directly with retail price
    addToCartWithPrice(product, "RETAIL", 1);
  };

  const addToCartWithPrice = (product: Product, priceType: PriceType, quantity: number) => {
    const price = priceType === "WHOLESALE" && product.sellPriceWholesale 
      ? product.sellPriceWholesale 
      : product.sellPrice;
    const unit = priceType === "WHOLESALE" && product.unitWholesale 
      ? product.unitWholesale 
      : product.unit;

    // Check stock
    const existingItem = cart.find((item) => item.productId === product.id && item.priceType === priceType);
    const totalQtyInCart = existingItem ? existingItem.quantity + quantity : quantity;
    
    // For wholesale, multiply by conversion rate to check stock
    const stockNeeded = priceType === "WHOLESALE" 
      ? totalQtyInCart * (product.unitConversion || 1)
      : totalQtyInCart;

    if (stockNeeded > product.stock) {
      alert("Stok tidak mencukupi");
      return;
    }

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id && item.priceType === priceType
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * item.price,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          product,
          quantity,
          price,
          subtotal: quantity * price,
          priceType,
          unit,
        },
      ]);
    }
  };

  const confirmAddToCart = () => {
    if (!selectedProduct) return;
    
    const qty = parseFloat(selectedQuantity) || 1;
    
    // Check minimum quantity for wholesale
    if (selectedPriceType === "WHOLESALE" && qty < selectedProduct.wholesaleMinQty) {
      alert(`Minimal pembelian grosir: ${selectedProduct.wholesaleMinQty} ${selectedProduct.unitWholesale || selectedProduct.unit}`);
      return;
    }

    addToCartWithPrice(selectedProduct, selectedPriceType, qty);
    setIsPriceSelectOpen(false);
    setSelectedProduct(null);
  };

  const updateQuantity = (productId: string, priceType: PriceType, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, priceType);
      return;
    }

    const product = products.find((p) => p.id === productId);
    const cartItem = cart.find((item) => item.productId === productId && item.priceType === priceType);
    
    if (product && cartItem) {
      // For wholesale, multiply by conversion rate to check stock
      const stockNeeded = priceType === "WHOLESALE" 
        ? quantity * (product.unitConversion || 1)
        : quantity;

      if (stockNeeded > product.stock) {
        alert("Stok tidak mencukupi");
        return;
      }
    }

    setCart(
      cart.map((item) =>
        item.productId === productId && item.priceType === priceType
          ? { ...item, quantity, subtotal: quantity * item.price }
          : item
      )
    );
  };

  const removeFromCart = (productId: string, priceType: PriceType) => {
    setCart(cart.filter((item) => !(item.productId === productId && item.priceType === priceType)));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const changeAmount = parseFloat(paymentAmount) - totalAmount;

  const handleCheckout = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) < totalAmount) {
      alert("Jumlah pembayaran kurang dari total");
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceType: item.priceType, // Send price type (RETAIL/WHOLESALE)
          })),
          paymentAmount: parseFloat(paymentAmount),
          paymentMethod,
        }),
      });

      if (res.ok) {
        const transaction = await res.json();
        setLastTransaction({
          invoiceNumber: transaction.invoiceNumber,
          totalAmount: transaction.totalAmount,
          paymentAmount: transaction.paymentAmount,
          changeAmount: transaction.changeAmount,
          items: transaction.transactionItems,
          createdAt: transaction.createdAt,
          cashierName: transaction.user?.name || "Kasir",
        });
        
        // Update local products stock instead of fetching all products
        setProducts((prevProducts) =>
          prevProducts.map((product) => {
            const cartItem = cart.find((item) => item.productId === product.id);
            if (cartItem) {
              return { ...product, stock: product.stock - cartItem.quantity };
            }
            return product;
          })
        );
        
        setCart([]);
        setPaymentAmount("");
        setIsCheckoutOpen(false);
        setIsNotaModalOpen(true); // Buka modal nota setelah transaksi berhasil
      } else {
        const error = await res.json();
        alert(error.error || "Terjadi kesalahan");
      }
    } catch (error) {
      console.error("Error processing transaction:", error);
      alert("Terjadi kesalahan");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-5rem)] lg:h-[calc(100vh-6rem)]">
        {/* Products Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-3 lg:mb-4">
            <Input
              placeholder="🔍 Cari produk (nama atau SKU)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-auto pb-20 lg:pb-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`p-2 sm:p-3 bg-white/80 backdrop-blur-sm border-2 rounded-xl text-left hover:border-rose-400 hover:shadow-lg transition-all active:scale-95 ${
                    product.sellPriceWholesale ? "border-emerald-300" : product.jualKiloan ? "border-purple-300" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-semibold text-sm truncate text-gray-900 flex-1">{product.name}</p>
                    {product.jualKiloan && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium shrink-0">⚖️ kg</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-900 mb-1">{product.sku}</p>
                  <div className="mt-1">
                    <p className="text-rose-600 font-bold text-sm sm:text-base">
                      {formatCurrency(product.sellPrice)}/{product.unit}
                    </p>
                    {product.sellPriceWholesale && (
                      <p className="text-emerald-600 text-xs font-medium">
                        Grosir: {formatCurrency(product.sellPriceWholesale)}/{product.unitWholesale || product.unit}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-900 mt-1">Stok: {product.stock} {product.unit}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Cart Toggle Button */}
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
          <button
            onClick={() => setIsCartVisible(true)}
            className="w-full bg-rose-500 text-white py-3 px-4 rounded-2xl shadow-lg flex items-center justify-between hover:bg-rose-600 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🛒</span>
              <span className="font-semibold">{cart.length} item</span>
            </div>
            <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
          </button>
        </div>

        {/* Cart Section - Desktop */}
        <div className="hidden lg:block">
          <Card className="w-80 xl:w-96 flex flex-col h-full">
            <CardHeader className="border-b border-rose-100">
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">🛒</span>
                Keranjang
                {cart.length > 0 && (
                  <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{cart.length}</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-3 xl:p-4">
              <div className="flex-1 overflow-auto space-y-2">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl block mb-2">🛒</span>
                    <p className="text-gray-900">Keranjang kosong</p>
                  </div>
                ) : (
                  cart.map((item, index) => (
                    <div key={`${item.productId}-${item.priceType}-${index}`} className="flex items-center gap-2 p-2 bg-rose-50/50 rounded-xl border border-rose-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{item.product.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-900">{formatCurrency(item.price)}/{item.unit}</p>
                          {item.priceType === "WHOLESALE" && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Grosir</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const step = item.product.jualKiloan ? 0.25 : 1;
                            updateQuantity(item.productId, item.priceType, Math.max(0, item.quantity - step));
                          }}
                          className="w-7 h-7 bg-white border border-rose-200 rounded-lg text-sm font-bold hover:bg-rose-100 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-sm font-semibold">
                          {item.product.jualKiloan ? item.quantity.toFixed(2) : item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            const step = item.product.jualKiloan ? 0.25 : 1;
                            updateQuantity(item.productId, item.priceType, item.quantity + step);
                          }}
                          className="w-7 h-7 bg-white border border-rose-200 rounded-lg text-sm font-bold hover:bg-rose-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <p className="w-20 text-right font-bold text-sm text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.productId, item.priceType)}
                        className="w-7 h-7 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-rose-100 pt-4 mt-4 space-y-3">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-rose-600">{formatCurrency(totalAmount)}</span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setIsCheckoutOpen(true)}
                  disabled={cart.length === 0}
                >
                  💳 Bayar Sekarang
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart Section - Mobile Slide Up */}
        {isCartVisible && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartVisible(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] flex flex-col animate-slide-up">
              <div className="flex items-center justify-between p-4 border-b border-rose-100">
                <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <span>🛒</span> Keranjang
                  {cart.length > 0 && (
                    <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{cart.length}</span>
                  )}
                </h2>
                <button 
                  onClick={() => setIsCartVisible(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-100 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-2">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl block mb-2">🛒</span>
                    <p className="text-gray-900">Keranjang kosong</p>
                  </div>
                ) : (
                  cart.map((item, index) => (
                    <div key={`${item.productId}-${item.priceType}-${index}`} className="flex items-center gap-2 p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{item.product.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-900">{formatCurrency(item.price)}/{item.unit}</p>
                          {item.priceType === "WHOLESALE" && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Grosir</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const step = item.product.jualKiloan ? 0.25 : 1;
                            updateQuantity(item.productId, item.priceType, Math.max(0, item.quantity - step));
                          }}
                          className="w-8 h-8 bg-white border border-rose-200 rounded-lg text-sm font-bold hover:bg-rose-100 active:scale-95 transition-all"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-sm font-semibold">
                          {item.product.jualKiloan ? item.quantity.toFixed(2) : item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            const step = item.product.jualKiloan ? 0.25 : 1;
                            updateQuantity(item.productId, item.priceType, item.quantity + step);
                          }}
                          className="w-8 h-8 bg-white border border-rose-200 rounded-lg text-sm font-bold hover:bg-rose-100 active:scale-95 transition-all"
                        >
                          +
                        </button>
                      </div>
                      <p className="w-20 text-right font-bold text-sm text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.productId, item.priceType)}
                        className="w-8 h-8 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-rose-100 p-4 space-y-3 bg-white">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-rose-600">{formatCurrency(totalAmount)}</span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    setIsCartVisible(false);
                    setIsCheckoutOpen(true);
                  }}
                  disabled={cart.length === 0}
                >
                  💳 Bayar Sekarang
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="💳 Pembayaran">
        <div className="space-y-4">
          <div className="text-center py-4 bg-linear-to-r from-rose-50 to-rose-100 rounded-2xl">
            <p className="text-sm text-gray-900">Total Pembayaran</p>
            <p className="text-3xl font-bold text-rose-600">{formatCurrency(totalAmount)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Metode Pembayaran</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["CASH", "DEBIT", "CREDIT", "QRIS"].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95 ${
                    paymentMethod === method
                      ? "bg-rose-500 text-white border-rose-500 shadow-md"
                      : "bg-white text-gray-900 border-gray-200 hover:border-rose-300"
                  }`}
                >
                  {method === "CASH" && "💵 "}
                  {method === "DEBIT" && "💳 "}
                  {method === "CREDIT" && "💳 "}
                  {method === "QRIS" && "📱 "}
                  {method}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Jumlah Bayar"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="0"
          />

          {paymentAmount && parseFloat(paymentAmount) >= totalAmount && (
            <div className="text-center py-3 bg-linear-to-r from-emerald-50 to-emerald-100 rounded-2xl">
              <p className="text-sm text-gray-900">Kembalian</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(changeAmount)}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setIsCheckoutOpen(false)}>
              Batal
            </Button>
            <Button
              className="flex-1"
              onClick={handleCheckout}
              disabled={!paymentAmount || parseFloat(paymentAmount) < totalAmount}
              isLoading={isProcessing}
            >
              ✓ Proses Pembayaran
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={!!lastTransaction}
        onClose={() => setLastTransaction(null)}
        title="🎉 Transaksi Berhasil"
      >
        {lastTransaction && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-linear-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-4xl text-white">✓</span>
            </div>
            <div>
              <p className="text-sm text-gray-900">No. Invoice</p>
              <p className="font-mono font-bold text-gray-900 text-lg">{lastTransaction.invoiceNumber}</p>
            </div>
            <div className="py-4 bg-linear-to-r from-gray-50 to-gray-100 rounded-2xl space-y-2">
              <div className="flex justify-between px-4 text-gray-900">
                <span>Total</span>
                <span className="font-bold">{formatCurrency(lastTransaction.totalAmount)}</span>
              </div>
              <div className="flex justify-between px-4 text-gray-900">
                <span>Bayar</span>
                <span>{formatCurrency(lastTransaction.paymentAmount)}</span>
              </div>
              <div className="flex justify-between px-4 text-emerald-600 text-lg">
                <span className="font-semibold">Kembalian</span>
                <span className="font-bold">{formatCurrency(lastTransaction.changeAmount)}</span>
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={() => setLastTransaction(null)}>
              🛒 Transaksi Baru
            </Button>
          </div>
        )}
      </Modal>

      {/* Price Selection Modal */}
      <Modal
        isOpen={isPriceSelectOpen}
        onClose={() => setIsPriceSelectOpen(false)}
        title={`🏷️ ${selectedProduct?.name}`}
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-900">Pilih Tipe Harga</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPriceType("RETAIL")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                    selectedPriceType === "RETAIL"
                      ? "border-rose-500 bg-rose-50 shadow-md"
                      : "border-gray-200 hover:border-rose-300"
                  }`}
                >
                  <p className="font-bold text-rose-600">🏪 Eceran</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(selectedProduct.sellPrice)}/{selectedProduct.unit}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPriceType("WHOLESALE")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                    selectedPriceType === "WHOLESALE"
                      ? "border-emerald-500 bg-emerald-50 shadow-md"
                      : "border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <p className="font-bold text-emerald-600">📦 Grosir</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(selectedProduct.sellPriceWholesale || 0)}/{selectedProduct.unitWholesale || selectedProduct.unit}
                  </p>
                  <p className="text-xs text-gray-900 mt-1">
                    Min. {selectedProduct.wholesaleMinQty} {selectedProduct.unitWholesale || selectedProduct.unit}
                  </p>
                </button>
              </div>
            </div>

            {/* Quick quantity buttons for decimal products */}
            {selectedProduct.jualKiloan && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">Pilih Jumlah Cepat</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3].map((qty) => {
                    // Format display: show as fraction or whole number
                    const displayQty = qty % 1 === 0 ? qty.toString() : qty.toString().replace('.', ',');
                    return (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setSelectedQuantity(qty.toString())}
                        className={`py-2 px-3 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95 ${
                          parseFloat(selectedQuantity) === qty
                            ? "bg-purple-500 text-white border-purple-500 shadow-md"
                            : "bg-white text-gray-900 border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        {displayQty} {selectedProduct.unitWholesale || selectedProduct.unit}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Input
              label={selectedProduct.jualKiloan ? "Jumlah dalam kg (misal: 0,5 atau 1,25)" : "Jumlah"}
              type="number"
              step={selectedProduct.jualKiloan ? "0.01" : "1"}
              value={selectedQuantity}
              onChange={(e) => setSelectedQuantity(e.target.value)}
              min={selectedProduct.jualKiloan ? "0.01" : "1"}
            />

            {selectedPriceType === "WHOLESALE" && parseFloat(selectedQuantity) < selectedProduct.wholesaleMinQty && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span>⚠️</span>
                <p className="text-sm text-amber-700">
                  Minimal pembelian grosir: {selectedProduct.wholesaleMinQty} {selectedProduct.unitWholesale || selectedProduct.unit}
                </p>
              </div>
            )}

            <div className="bg-linear-to-r from-rose-50 to-gray-50 p-4 rounded-2xl border border-rose-100">
              <div className="flex justify-between text-gray-900">
                <span className="font-medium">Subtotal:</span>
                <span className="font-bold text-lg text-rose-600">
                  {formatCurrency(
                    (parseFloat(selectedQuantity) || 0) * 
                    (selectedPriceType === "WHOLESALE" ? (selectedProduct.sellPriceWholesale || 0) : selectedProduct.sellPrice)
                  )}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setIsPriceSelectOpen(false)}>
                Batal
              </Button>
              <Button className="flex-1" onClick={confirmAddToCart}>
                🛒 Tambah ke Keranjang
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Nota Digital dengan QR Code */}
      <Modal
        isOpen={isNotaModalOpen}
        onClose={() => {
          setIsNotaModalOpen(false);
          setLastTransaction(null);
        }}
        title="✅ Transaksi Berhasil!"
        size="md"
      >
        {lastTransaction && (
          <div className="space-y-6">
            {/* Ringkasan Transaksi */}
            <div className="bg-linear-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200">
              <div className="text-center mb-3">
                <p className="text-sm text-gray-900">No. Invoice</p>
                <p className="font-mono font-bold text-lg text-green-700">{lastTransaction.invoiceNumber}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="text-gray-900">Total</p>
                  <p className="font-bold text-gray-900">{formatCurrency(lastTransaction.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-900">Bayar</p>
                  <p className="font-bold text-gray-900">{formatCurrency(lastTransaction.paymentAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-900">Kembali</p>
                  <p className="font-bold text-green-600">{formatCurrency(lastTransaction.changeAmount)}</p>
                </div>
              </div>
            </div>

            {/* QR Code Nota Digital */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3 text-center flex items-center justify-center gap-2">
                <span className="text-2xl">📱</span>
                Nota Digital (Opsional)
              </h4>
              <p className="text-sm text-gray-900 mb-4 text-center">
                Pelanggan dapat scan QR code ini untuk melihat dan download nota
              </p>
              
              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-gray-200">
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/nota/${lastTransaction.invoiceNumber}`}
                    size={180}
                    level="M"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
              </div>
              
              {/* URL untuk copy */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/nota/${lastTransaction.invoiceNumber}`}
                  className="flex-1 bg-transparent text-xs text-gray-900 font-mono outline-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/nota/${lastTransaction.invoiceNumber}`);
                    alert("Link nota berhasil disalin!");
                  }}
                >
                  📋 Copy
                </Button>
              </div>
            </div>

            {/* Tombol Selesai */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setIsNotaModalOpen(false);
                  setLastTransaction(null);
                }}
              >
                Selesai
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
