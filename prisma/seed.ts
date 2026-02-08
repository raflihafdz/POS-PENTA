import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@pospenta.com" },
    update: {},
    create: {
      name: "Administrator",
      email: "admin@pospenta.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin user created:", admin.email);

  // Create sample kasir
  const kasirPassword = await hash("kasir123", 12);
  const kasir = await prisma.user.upsert({
    where: { email: "kasir@pospenta.com" },
    update: {},
    create: {
      name: "Kasir Demo",
      email: "kasir@pospenta.com",
      password: kasirPassword,
      role: "KASIR",
    },
  });
  console.log("Kasir user created:", kasir.email);

  // Create sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "Makanan" },
      update: {},
      create: { name: "Makanan" },
    }),
    prisma.category.upsert({
      where: { name: "Minuman" },
      update: {},
      create: { name: "Minuman" },
    }),
    prisma.category.upsert({
      where: { name: "Snack" },
      update: {},
      create: { name: "Snack" },
    }),
  ]);
  console.log("Categories created:", categories.length);

  // Create sample products
  const products = [
    { name: "Nasi Goreng", sku: "MKN-001", buyPrice: 8000, sellPrice: 15000, stock: 50, categoryId: categories[0].id },
    { name: "Mie Goreng", sku: "MKN-002", buyPrice: 7000, sellPrice: 13000, stock: 50, categoryId: categories[0].id },
    { name: "Ayam Goreng", sku: "MKN-003", buyPrice: 12000, sellPrice: 20000, stock: 30, categoryId: categories[0].id },
    { name: "Es Teh Manis", sku: "MNM-001", buyPrice: 2000, sellPrice: 5000, stock: 100, categoryId: categories[1].id },
    { name: "Es Jeruk", sku: "MNM-002", buyPrice: 3000, sellPrice: 7000, stock: 100, categoryId: categories[1].id },
    { name: "Kopi", sku: "MNM-003", buyPrice: 4000, sellPrice: 8000, stock: 80, categoryId: categories[1].id },
    { name: "Keripik Kentang", sku: "SNK-001", buyPrice: 5000, sellPrice: 10000, stock: 40, categoryId: categories[2].id },
    { name: "Cokelat Bar", sku: "SNK-002", buyPrice: 8000, sellPrice: 15000, stock: 25, categoryId: categories[2].id },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }
  console.log("Products created:", products.length);

  console.log("Seeding completed!");
  console.log("\n--- Login Credentials ---");
  console.log("Admin: admin@pospenta.com / admin123");
  console.log("Kasir: kasir@pospenta.com / kasir123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
