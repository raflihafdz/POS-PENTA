"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Modal, Select, Pagination } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types";

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [stockFormData, setStockFormData] = useState({
    productId: "",
    type: "IN",
    quantity: "",
    note: "",
  });
  const [priceFormData, setPriceFormData] = useState({
    sellPrice: "",
    sellPriceWholesale: "",
    wholesaleMinQty: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?activeOnly=true");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockFormData),
      });

      if (res.ok) {
        fetchProducts();
        closeStockModal();
        alert("Stok berhasil diperbarui");
      } else {
        const error = await res.json();
        alert(error.error || "Terjadi kesalahan");
      }
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const handlePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) return;

    try {
      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(priceFormData),
      });

      if (res.ok) {
        fetchProducts();
        closePriceModal();
        alert("Harga berhasil diperbarui");
      } else {
        const error = await res.json();
        alert(error.error || "Terjadi kesalahan");
      }
    } catch (error) {
      console.error("Error updating price:", error);
    }
  };

  const openStockModal = (product?: Product) => {
    setStockFormData({
      productId: product?.id || "",
      type: "IN",
      quantity: "",
      note: "",
    });
    setIsStockModalOpen(true);
  };

  const closeStockModal = () => {
    setIsStockModalOpen(false);
  };

  const openPriceModal = (product: Product) => {
    setSelectedProduct(product);
    setPriceFormData({
      sellPrice: product.sellPrice.toString(),
      sellPriceWholesale: product.sellPriceWholesale?.toString() || "",
      wholesaleMinQty: product.wholesaleMinQty?.toString() || "1",
    });
    setIsPriceModalOpen(true);
  };

  const closePriceModal = () => {
    setIsPriceModalOpen(false);
    setSelectedProduct(null);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Stok & Harga</h1>
          <Button onClick={() => openStockModal()}>+ Tambah Stok</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-900">Total Produk</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-900">Stok Rendah</p>
              <p className="text-2xl font-bold text-red-600">
                {products.filter((p) => p.stock <= p.minStock).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-900">Total Nilai Inventori</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(products.reduce((sum, p) => sum + p.sellPrice * p.stock, 0))}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Input
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedProducts.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 border rounded-lg ${
                    product.stock <= product.minStock
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-900">{product.sku}</p>
                    </div>
                    <span
                      className={`text-2xl font-bold ${
                        product.stock <= product.minStock ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      {product.stock} {product.unit}
                    </span>
                  </div>
                  
                  {/* Price Info */}
                  <div className="text-sm mb-3 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-900">Eceran:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(product.sellPrice)}/{product.unit}</span>
                    </div>
                    {product.sellPriceWholesale && (
                      <div className="flex justify-between">
                        <span className="text-gray-900">Grosir:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(product.sellPriceWholesale)}/{product.unitWholesale || product.unit}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-3 gap-2">
                    <span className="text-xs text-gray-900">
                      Min: {product.minStock}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openPriceModal(product)}>
                        Edit Harga
                      </Button>
                      <Button size="sm" onClick={() => openStockModal(product)}>
                        Update Stok
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {filteredProducts.length > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredProducts.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock Update Modal */}
      <Modal isOpen={isStockModalOpen} onClose={closeStockModal} title="Update Stok">
        <form onSubmit={handleStockSubmit} className="space-y-4">
          <Select
            label="Produk"
            value={stockFormData.productId}
            onChange={(e) => setStockFormData({ ...stockFormData, productId: e.target.value })}
            options={[
              { value: "", label: "Pilih Produk" },
              ...products.map((p) => ({ value: p.id, label: `${p.name} (Stok: ${p.stock})` })),
            ]}
            required
          />

          <Select
            label="Tipe"
            value={stockFormData.type}
            onChange={(e) => setStockFormData({ ...stockFormData, type: e.target.value })}
            options={[
              { value: "IN", label: "Barang Masuk" },
              { value: "OUT", label: "Barang Keluar" },
              { value: "ADJUSTMENT", label: "Penyesuaian (Set ke nilai tertentu)" },
            ]}
          />

          <Input
            label={stockFormData.type === "ADJUSTMENT" ? "Stok Baru" : "Jumlah"}
            type="number"
            value={stockFormData.quantity}
            onChange={(e) => setStockFormData({ ...stockFormData, quantity: e.target.value })}
            min="1"
            required
          />

          <Input
            label="Catatan"
            value={stockFormData.note}
            onChange={(e) => setStockFormData({ ...stockFormData, note: e.target.value })}
            placeholder="Opsional: alasan perubahan stok"
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={closeStockModal}>
              Batal
            </Button>
            <Button type="submit">Update Stok</Button>
          </div>
        </form>
      </Modal>

      {/* Price Edit Modal */}
      <Modal isOpen={isPriceModalOpen} onClose={closePriceModal} title={`Edit Harga: ${selectedProduct?.name}`}>
        <form onSubmit={handlePriceSubmit} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-3">Harga Eceran</h4>
            <Input
              label={`Harga Jual per ${selectedProduct?.unit || 'pcs'}`}
              type="number"
              value={priceFormData.sellPrice}
              onChange={(e) => setPriceFormData({ ...priceFormData, sellPrice: e.target.value })}
              required
            />
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-3">Harga Grosir (Opsional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={`Harga Grosir per ${selectedProduct?.unitWholesale || selectedProduct?.unit || 'pcs'}`}
                type="number"
                value={priceFormData.sellPriceWholesale}
                onChange={(e) => setPriceFormData({ ...priceFormData, sellPriceWholesale: e.target.value })}
                placeholder="Kosongkan jika tidak ada"
              />
              <Input
                label="Min. Qty untuk Grosir"
                type="number"
                value={priceFormData.wholesaleMinQty}
                onChange={(e) => setPriceFormData({ ...priceFormData, wholesaleMinQty: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={closePriceModal}>
              Batal
            </Button>
            <Button type="submit">Simpan Harga</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
