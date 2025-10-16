# Jejaka Rempah Marketplace

Proyek marketplace untuk jual beli rempah-rempah dan bumbu dengan fitur lengkap untuk pembeli dan penjual.

## 🚀 Teknologi Yang Digunakan

- **Framework**: Next.js 15 dengan TypeScript
- **Database**: PostgreSQL dengan Drizzle ORM
- **Authentication**: Better Auth
- **Styling**: Tailwind CSS
- **State Management**: Zustand & TanStack Query
- **UI Components**: Radix UI + shadcn/ui

## 📋 Prasyarat

Sebelum menjalankan proyek ini, pastikan Anda telah menginstall:

- **Node.js** versi 18 atau lebih tinggi
- **PostgreSQL** database server
- **Bun** (opsional, tapi direkomendasikan)

### Menginstall PostgreSQL

#### Windows:

```bash
# Download dan install PostgreSQL dari:
# https://www.postgresql.org/download/windows/

# Atau menggunakan Chocolatey:
choco install postgresql
```

#### Linux (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### macOS:

```bash
brew install postgresql
```

## 🛠️ Instalasi dan Setup

### 1. Clone Repository

```bash
git clone https://github.com/fadilsflow/jejakrempah-marketplace
cd jejakrempah-marketplace
```

### 2. Install Dependencies

```bash
# Menggunakan Bun (Direkomendasikan)
bun install

# Atau menggunakan npm
npm install

# Atau menggunakan yarn
yarn install
```

### 3. Setup Environment Variables

#### Windows (Command Prompt):

```cmd
copy .env.example .env
```

#### Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

#### Linux/macOS (Bash):

```bash
cp .env.example .env
```

### 4. Konfigurasi Database

Edit file `.env` dan pastikan DATABASE_URL sudah benar:

```env
DATABASE_URL=postgresql://fadil@localhost:5432/jejakrempah-marketplace
```

### 5. Setup Database Schema

#### Menggunakan Bun:

```bash
bunx drizzle-kit push
```

#### Menggunakan npx:

```bash
npx drizzle-kit push
```

### 6. Seed Database dengan Data Test (Opsional)

Untuk mengisi database dengan data test, jalankan seeder:

#### Menggunakan Bun:

```bash
bun run db:seed
```

#### Menggunakan npm:

```bash
npm run db:seed
```

Seeder akan membuat:
- **4 User**: 2 penjual, 2 pembeli
- **2 Toko**: dengan produk lengkap
- **6 Produk**: rempah-rempah dan bumbu
- **3 Alamat**: untuk pembeli
- **2 Keranjang Belanja**: dengan item
- **3 Pesanan**: dengan status berbeda
- **2 Pembayaran**: untuk pesanan yang sudah dibayar

**Akun Test:**
- **Penjual**: `ahmad@example.com`, `siti@example.com`
- **Pembeli**: `budi@example.com`, `maya@example.com`

## 🚀 Menjalankan Proyek

### Development Mode

#### Menggunakan Bun:

```bash
bun run dev
```

#### Menggunakan npm:

```bash
npm run dev
```

#### Menggunakan yarn:

```bash
yarn dev
```

Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000)

### Production Mode

#### Build aplikasi:

```bash
# Menggunakan Bun
bun run build

# Menggunakan npm
npm run build

# Menggunakan yarn
yarn build
```

#### Jalankan production server:

```bash
# Menggunakan Bun
bun run start

# Menggunakan npm
npm run start

# Menggunakan yarn
yarn start
```

## 📜 Script Yang Tersedia

| Script                            | Deskripsi                       |
| --------------------------------- | ------------------------------- |
| `bun run dev` / `npm run dev`     | Jalankan development server     |
| `bun run build` / `npm run build` | Build aplikasi untuk production |
| `bun run start` / `npm run start` | Jalankan production server      |
| `bun run db:seed` / `npm run db:seed` | Seed database dengan data test |
| `bun run lint` / `npm run lint`   | Jalankan ESLint                 |

## 🗄️ Database Management

### Push Schema ke Database:

```bash
bunx drizzle-kit push
```

### Generate Migration:

```bash
bunx drizzle-kit generate
```

### Lihat Status Migration:

```bash
bunx drizzle-kit check
```

## 🔧 Troubleshooting

### Error: "Can't reach database server"

- Pastikan PostgreSQL service sedang berjalan
- Periksa DATABASE_URL di file .env
- Pastikan database `jejakrempah-marketplace` sudah dibuat

### Error: "Port 3000 already in use"

```bash
# Kill process di port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS:
lsof -ti:3000 | xargs kill -9
```

### Error: "Module not found"

```bash
# Hapus node_modules dan install ulang
rm -rf node_modules
bun install
```

## 📁 Struktur Proyek

```
jejakrempah-marketplace/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API Routes
│   │   ├── settings/       # Halaman Settings
│   │   └── ...
│   ├── components/         # React Components
│   ├── lib/               # Utilities & Configurations
│   └── db/                # Database Schema & Config
├── public/                # Static Assets
├── .env.example          # Template Environment Variables
└── README.md             # Dokumentasi Proyek
```

## 🌟 Fitur Utama

- ✅ **Authentication**: Login/Register dengan Better Auth
- ✅ **Store Management**: Kelola toko dan produk
- ✅ **Order Management**: Sistem pesanan lengkap
- ✅ **Address Management**: Kelola alamat pengiriman
- ✅ **Cart System**: Keranjang belanja
- ✅ **Payment Integration**: Sistem pembayaran
- ✅ **Admin Dashboard**: Dashboard untuk penjual
- ✅ **Responsive Design**: UI yang responsive

## 📞 Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini.

---

**Thanks**
