"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select, Pagination } from "@/components/ui";
import { formatCurrency, generateSKU } from "@/lib/utils";
import { Product, Category } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    buyPrice: "",
    sellPrice: "",
    sellPriceWholesale: "",
    wholesaleMinQty: "1",
    unitWholesale: "",
    stock: "",
    minStock: "5",
    unit: "pcs",
    unitConversion: "1",
    categoryId: "",
    expiryDate: "",
    expiryAlertDays: "30",
    jualKiloan: false,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchProducts();
        closeModal();
      } else {
        const error = await res.json();
        alert(error.error || "Terjadi kesalahan");
      }
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchProducts();
      } else {
        const error = await res.json();
        alert(error.error || "Terjadi kesalahan");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        description: product.description || "",
        buyPrice: product.buyPrice.toString(),
        sellPrice: product.sellPrice.toString(),
        sellPriceWholesale: product.sellPriceWholesale?.toString() || "",
        wholesaleMinQty: product.wholesaleMinQty?.toString() || "1",
        unitWholesale: product.unitWholesale || "",
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
        unit: product.unit || "pcs",
        unitConversion: product.unitConversion?.toString() || "1",
        categoryId: product.categoryId || "",
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : "",
        expiryAlertDays: product.expiryAlertDays?.toString() || "30",
        jualKiloan: product.jualKiloan || false,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        sku: "",
        description: "",
        buyPrice: "",
        sellPrice: "",
        sellPriceWholesale: "",
        wholesaleMinQty: "1",
        unitWholesale: "",
        stock: "",
        minStock: "5",
        unit: "pcs",
        unitConversion: "1",
        categoryId: "",
        expiryDate: "",
        expiryAlertDays: "30",
        jualKiloan: false,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const generateProductSKU = () => {
    if (formData.name) {
      setFormData({ ...formData, sku: generateSKU(formData.name) });
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Produk</h1>
          <Button onClick={() => openModal()}>+ Tambah Produk</Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex gap-4">
              <Input
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga Eceran</TableHead>
                  <TableHead>Harga Grosir</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Kadaluarsa</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => {
                  // Calculate days until expiry
                  let expiryStatus = null;
                  if (product.expiryDate) {
                    const now = new Date();
                    const expiry = new Date(product.expiryDate);
                    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 0) {
                      expiryStatus = { text: "KADALUARSA", color: "bg-red-100 text-red-700" };
                    } else if (diffDays <= product.expiryAlertDays) {
                      expiryStatus = { text: `${diffDays} hari lagi`, color: "bg-yellow-100 text-yellow-700" };
                    } else {
                      expiryStatus = { text: new Date(product.expiryDate).toLocaleDateString('id-ID'), color: "bg-green-100 text-green-700" };
                    }
                  }

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono">{product.sku}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category?.name || "-"}</TableCell>
                      <TableCell>
                        <div>
                          <div>{formatCurrency(product.sellPrice)}</div>
                          <div className="text-xs text-gray-900">/{product.unit}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.sellPriceWholesale ? (
                          <div>
                            <div>{formatCurrency(product.sellPriceWholesale)}</div>
                            <div className="text-xs text-gray-900">
                              /{product.unitWholesale || product.unit} (min {product.wholesaleMinQty})
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            product.stock <= product.minStock
                              ? "text-red-600 font-semibold"
                              : ""
                          }
                        >
                          {product.stock} {product.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        {expiryStatus ? (
                          <span className={`px-2 py-1 rounded-full text-xs ${expiryStatus.color}`}>
                            {expiryStatus.text}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openModal(product)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(product.id)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell className="text-center text-gray-900 py-8" colSpan={8}>
                      Tidak ada produk ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          
          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="px-6 pb-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredProducts.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Produk"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="SKU"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
            <Button type="button" variant="secondary" onClick={generateProductSKU} className="mt-6">
              Generate
            </Button>
          </div>

          <Input
            label="Deskripsi"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Select
            label="Kategori"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            options={[
              { value: "", label: "Pilih Kategori" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Harga Beli"
              type="number"
              value={formData.buyPrice}
              onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
            />
            <Input
              label="Satuan Eceran"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="pcs, buah, dll"
            />
          </div>

          {/* Harga Eceran */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h4 className="font-semibold text-blue-800 mb-3">Harga Eceran</h4>
            <Input
              label="Harga Jual Eceran"
              type="number"
              value={formData.sellPrice}
              onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
              required
            />
          </div>

          {/* Harga Grosir */}
          <div className="border rounded-lg p-4 bg-green-50">
            <h4 className="font-semibold text-green-800 mb-3">Harga Grosir (Opsional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Harga Jual Grosir"
                type="number"
                value={formData.sellPriceWholesale}
                onChange={(e) => setFormData({ ...formData, sellPriceWholesale: e.target.value })}
                placeholder="Kosongkan jika tidak ada"
              />
              <Input
                label="Min. Qty untuk Grosir"
                type="number"
                value={formData.wholesaleMinQty}
                onChange={(e) => setFormData({ ...formData, wholesaleMinQty: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                label="Satuan Grosir"
                value={formData.unitWholesale}
                onChange={(e) => setFormData({ ...formData, unitWholesale: e.target.value })}
                placeholder="kg, lusin, box, dll"
              />
              <Input
                label="Konversi (1 grosir = X eceran)"
                type="number"
                value={formData.unitConversion}
                onChange={(e) => setFormData({ ...formData, unitConversion: e.target.value })}
                placeholder="Contoh: 12 untuk lusin"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Stok Awal"
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              disabled={!!editingProduct}
            />
            <Input
              label="Stok Minimum"
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            />
          </div>

          {/* Jual Kiloan */}
          <div className="border rounded-lg p-4 bg-purple-50">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.jualKiloan}
                onChange={(e) => setFormData({ ...formData, jualKiloan: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-rose-500 focus:ring-rose-400"
              />
              <div>
                <span className="font-semibold text-purple-800">⚖️ Jual Kiloan</span>
                <p className="text-sm text-purple-600">Aktifkan untuk produk yang dijual per kg seperti beras, telur, gula, dll (bisa beli 0,5 kg, 1,25 kg)</p>
              </div>
            </label>
          </div>

          {/* Tanggal Kadaluarsa */}
          <div className="border rounded-lg p-4 bg-yellow-50">
            <h4 className="font-semibold text-yellow-800 mb-3">Informasi Kadaluarsa (Opsional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tanggal Kadaluarsa"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
              <Input
                label="Alert (Hari Sebelum)"
                type="number"
                value={formData.expiryAlertDays}
                onChange={(e) => setFormData({ ...formData, expiryAlertDays: e.target.value })}
                placeholder="30"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Batal
            </Button>
            <Button type="submit">
              {editingProduct ? "Simpan Perubahan" : "Tambah Produk"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
