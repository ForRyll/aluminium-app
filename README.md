# Aluminium App

Aplikasi web untuk membantu pengelolaan operasional usaha aluminium, mulai dari data pelanggan, material, pesanan, pembayaran, hingga pemantauan melalui dashboard.

> README ini disusun berdasarkan struktur source code dan konfigurasi package yang tersedia pada repository. Sesuaikan konfigurasi environment dengan kebutuhan deployment masing-masing.

## Fitur

Fitur yang tersedia pada source code saat ini meliputi:

- Autentikasi pengguna.
- Dashboard untuk pemantauan data operasional.
- Manajemen pelanggan (customers).
- Manajemen material.
- Manajemen pesanan (orders).
- Pengelolaan foto pesanan.
- Pencatatan pembayaran.
- Pengingat tagihan melalui WhatsApp.
- Ekspor data ke Excel.

## Tech Stack

### Bahasa pemrograman

- **TypeScript** — bahasa utama untuk frontend dan backend.
- **JavaScript** — konfigurasi dan ekosistem tooling Node.js.
- **HTML dan CSS** — struktur serta styling antarmuka melalui Svelte dan Tailwind CSS.

### Framework dan tools

| Bagian | Teknologi |
|---|---|
| Frontend framework | Svelte 5 |
| Frontend application framework | SvelteKit 3 |
| Frontend build tool | Vite 8 |
| CSS framework | Tailwind CSS 4 |
| Backend framework | NestJS 12 |
| ORM | TypeORM |
| Database | PostgreSQL |
| Runtime | Node.js |
| Backend validation | class-validator dan class-transformer |

Versi di atas mengikuti rentang versi dependencies yang tercantum pada `package.json`. Versi aktual yang terpasang dapat berbeda sesuai lockfile dan hasil instalasi.

## Struktur Project

```text
aluminium-app/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── customers/
│   │   ├── dashboard/
│   │   ├── export/
│   │   ├── materials/
│   │   ├── orders/
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── lib/
    │   └── routes/
    └── package.json
```

Struktur di atas merupakan gambaran direktori utama. Folder atau file lain dapat ditambahkan seiring pengembangan aplikasi.

## Persyaratan

Pastikan perangkat sudah memiliki:

- Node.js yang kompatibel dengan versi dependencies project (disarankan menggunakan Node.js LTS terbaru).
- npm.
- PostgreSQL.
- Git.

Periksa instalasi Node.js dan npm:

```bash
node -v
npm -v
```

## Instalasi

### 1. Clone repository

```bash
git clone https://github.com/ForRyll/aluminium-app.git
cd aluminium-app
```

### 2. Install dependencies backend

Buka terminal pada root project:

```bash
cd backend
npm install
```

### 3. Konfigurasi database backend

Buat file bernama `.env` di dalam folder `backend`.

Contoh konfigurasi PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password_postgres
DB_NAME=aluminium_app
DB_SYNC=true
```

Sesuaikan nilai konfigurasi dengan PostgreSQL lokal. Buat database `aluminium_app` terlebih dahulu melalui PostgreSQL.

**Catatan:** `DB_SYNC=true` ditujukan untuk pengembangan lokal. Untuk production, gunakan migration yang sesuai dan nonaktifkan synchronize (`DB_SYNC=false`) agar perubahan skema tidak berisiko mengubah atau menghilangkan data.

### 4. Install dependencies frontend

Buka terminal baru dari root project:

```bash
cd frontend
npm install
```

Jika frontend menggunakan environment variable untuk alamat API pada konfigurasi lokal, isi sesuai nama variable dan format yang digunakan oleh source code frontend. Jangan memasukkan secret ke dalam variable frontend karena konfigurasi frontend dapat terekspos ke browser.

## Menjalankan Aplikasi

Jalankan PostgreSQL terlebih dahulu, kemudian jalankan backend dan frontend pada dua terminal terpisah.

### Terminal 1 — Backend

```bash
cd backend
npm run start:dev
```

NestJS akan berjalan dalam mode development dengan watch mode.

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Buka alamat lokal yang ditampilkan oleh Vite pada terminal. Secara default, Vite biasanya menggunakan:

```text
http://localhost:5173
```

Pastikan alamat API yang digunakan frontend mengarah ke backend yang sedang berjalan.

## Perintah Development

### Backend

| Perintah | Keterangan |
|---|---|
| `npm run start:dev` | Menjalankan backend dengan watch mode |
| `npm run start` | Menjalankan backend |
| `npm run build` | Build backend |
| `npm run start:prod` | Menjalankan hasil build |
| `npm run test` | Menjalankan unit test |
| `npm run test:e2e` | Menjalankan end-to-end test |
| `npm run lint` | Menjalankan linting |

### Frontend

| Perintah | Keterangan |
|---|---|
| `npm run dev` | Menjalankan development server |
| `npm run build` | Build frontend |
| `npm run preview` | Preview hasil build |
| `npm run check` | Memeriksa tipe dan validitas Svelte |

## Catatan Keamanan

- Jangan commit file `.env`, password database, access token, atau secret lainnya.
- Gunakan environment variable yang berbeda untuk development dan production.
- Jangan mengaktifkan TypeORM synchronize pada production.
- Pastikan konfigurasi CORS, autentikasi, dan koneksi database disesuaikan sebelum aplikasi dipublikasikan.

## Repository

[ForRyll/aluminium-app](https://github.com/ForRyll/aluminium-app)
