# POS PENTA - Point of Sale SystemThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



Sistem Point of Sale (POS) dengan 2 role: Admin dan Kasir.## Getting Started



## TeknologiFirst, run the development server:



- **Framework**: Next.js 16 (App Router)```bash

- **Bahasa**: TypeScript (React TSX)npm run dev

- **ORM**: Prisma# or

- **Auth**: NextAuth.jsyarn dev

- **Styling**: Tailwind CSS# or

- **Database**: PostgreSQL (Neon)pnpm dev

- **Deployment**: Vercel# or

bun dev

## Fitur```



### AdminOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- Dashboard overview

- Manajemen Produk (CRUD)You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

- Manajemen Kategori (CRUD)

- Manajemen Stok (tambah stok, barang masuk/keluar)This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

- Riwayat Stok

- Manajemen Kasir (tambah kasir baru)## Learn More

- Riwayat Transaksi

- Laporan PenjualanTo learn more about Next.js, take a look at the following resources:



### Kasir- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- Point of Sale (transaksi penjualan)- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

- Riwayat Transaksi Pribadi

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Setup Development

## Deploy on Vercel

### 1. Clone dan Install Dependencies

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

```bash

git clone <repository-url>Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

cd POS-PENTA
npm install
```

### 2. Setup Database (Neon)

1. Buat akun di [Neon](https://neon.tech)
2. Buat project baru dan dapatkan connection string
3. Copy `.env.example` ke `.env` dan isi dengan connection string:

```env
DATABASE_URL="postgresql://username:password@host.neon.tech/database?sslmode=require"
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Setup Database Schema

```bash
# Push schema ke database
npx prisma db push

# Seed data awal (admin & sample data)
npm run db:seed
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Kredensial Login

Setelah menjalankan seed:

| Role  | Email              | Password  |
|-------|-------------------|-----------|
| Admin | admin@pospenta.com | admin123  |
| Kasir | kasir@pospenta.com | kasir123  |

## Deployment ke Vercel

### 1. Setup Project di Vercel

1. Push kode ke GitHub
2. Import project di [Vercel](https://vercel.com)
3. Hubungkan dengan repository GitHub

### 2. Environment Variables

Di Vercel Dashboard, tambahkan environment variables:

```
DATABASE_URL=<neon-connection-string>
NEXTAUTH_SECRET=<generate-random-secret>
NEXTAUTH_URL=https://your-domain.vercel.app
```

Untuk generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 3. Deploy

Vercel akan otomatis build dan deploy saat push ke branch main.

## Struktur Folder

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Halaman Admin
│   ├── kasir/             # Halaman Kasir
│   ├── login/             # Halaman Login
│   └── api/               # API Routes
├── components/            # React Components
│   ├── layout/            # Layout components
│   ├── ui/                # Reusable UI components
│   └── providers.tsx      # Context Providers
├── lib/                   # Utilities & Config
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript types
└── middleware.ts         # Auth middleware

prisma/
├── schema.prisma         # Database schema
└── seed.ts              # Seed data
```

## Scripts

| Command          | Deskripsi                    |
|-----------------|------------------------------|
| npm run dev     | Development server           |
| npm run build   | Build untuk production       |
| npm run start   | Jalankan production build    |
| npm run lint    | Jalankan ESLint             |
| npm run db:push | Push schema ke database      |
| npm run db:seed | Seed data ke database        |

## License

MIT
