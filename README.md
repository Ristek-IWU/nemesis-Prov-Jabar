# Nemesis
Nemesis adalah antarmuka investigasi untuk publik sebagai hasil Operasi Diponegoro, yang digagas Abil Sudarman School of Artificial Intelligence. Kami memproses jutaan baris data pengadaan, menampilkan anomali, dan menyajikan temuan agar mudah dipahami warga, jurnalis, dan pembuat kebijakan.

Dashboard live: https://assai.id/nemesis

## Tentang repositori ini (`nemesis-Prov-Jabar`)

Cabang ini disiapkan untuk **deployment regional yang berfokus pada Jawa Barat**. Kode aplikasinya sama dengan stack Nemesis; perbedaannya ada pada cara menyiapkan berkas SQLite:

- **`data/dashboard.sqlite`** — dashboard nasional utuh (berkas besar; skema sama dengan Nemesis upstream).
- **`data/database.sqlite`** — **subset** yang dihasilkan secara lokal: satu baris provinsi (`province-jawa-barat`), seluruh **27** kabupaten/kota di Jawa Barat (18 kabupaten, 9 kota), serta hanya paket + metrik + pemetaan yang masuk dalam cakupan itu. Aset disalin utuh agar antarmuka tetap berjalan.

Langkah filter diimplementasikan di **`scripts/filter_database.js`** dan dijalankan lewat **`npm run db:filter`**. Setelah data disalin memakai basis data ter-attach, indeks dibuat dalam **tahap kedua** dengan membuka `database.sqlite` sebagai basis utama (perintah `CREATE INDEX … ON packages(…)` biasa, selaras dengan `seed.js`). Pendekatan ini menghindari penulisan ulang DDL dari `sqlite_master` yang rapuh di berbagai versi SQLite.

Di akhir proses yang sukses, skrip mencetak blok **verifikasi** singkat (jumlah provinsi, wilayah, rincian `region_type`). Jika ada yang mencurigakan, periksa apakah data sumber memakai `province_name = 'Jawa Barat'` dan `province_key = 'province-jawa-barat'`.

> End the vampire ball.


## Status rilis

| Aset | Status | ETA |
|-------|--------|-----|
| Model fine-tuned | 🟡 Dalam pengerjaan | ? |
| Kode sumber scraping & analisis | 🟡 Dalam pengerjaan | ? |



Nantikan pembaruan.

## Unduhan

### Dataset

[Unduh dataset SIRUP mentah jsonl (dianalisis dengan GPT-5.4)](https://contenflowstorage.blob.core.windows.net/shared/gpt-5.4-analyzed-sirup.zip?sp=r&st=2026-04-16T12:00:08Z&se=2029-04-16T20:15:08Z&spr=https&sv=2025-11-05&sr=b&sig=m%2FATynnnZq5gSdP8xWWw2ew41EMJZz09fDQRwpbWolk%3D)

[Unduh dataset SIRUP versi SQL (dianalisis dengan GPT-5.4-mini)](https://contenflowstorage.blob.core.windows.net/shared/datasets/dashboard.sql?sp=r&st=2026-04-16T12:16:15Z&se=2029-04-16T20:31:15Z&spr=https&sv=2025-11-05&sr=b&sig=sKPH9uazyLcYcSwhARcEwVSG%2FTld9VnGJgZ2mOZIxrA%3D)


### Model
Nantikan pembaruan.

### 1. Menyiapkan basis data

Anda punya beberapa opsi untuk menginisialisasi basis data:

**Opsi A: Bangun dari dataset mentah (disarankan)**  
Jika Anda mengunduh dataset `jsonl` mentah, letakkan berkas yang sudah di-unzip di folder `dataset/` di akar proyek. Lalu bangun basis data secara dinamis:

```bash
npm run db:reset
```

**Opsi B: Impor dump SQL V1 yang sudah dianalisis**  
Jika Anda memakai dump teks `dashboard.sql`, Anda harus mengompilasinya ke format biner SQLite V2. Letakkan `dashboard.sql` di folder `data/` lalu jalankan:

```bash
# 1. Hapus biner lama yang rusak (jika ada)
rm -f data/dashboard.sqlite

# 2. Impor dump teks besar (~4,4 GB) ke SQLite biner
sqlite3 data/dashboard.sqlite < data/dashboard.sql

# 3. Patch data V1 ke V2.0.0 untuk analitik (jika repositori Anda menyertakan berkas patch)
sqlite3 data/dashboard.sqlite < data/patch-v1-to-v2.sql
```

**Opsi C: SQLite nasional → subset Jawa Barat (repositori ini)**  
Pakai ini bila Anda sudah punya **`data/dashboard.sqlite`** (data nasional penuh) dan ingin berkas yang lebih kecil untuk lokal atau hosting regional.

```bash
npm install   # jika belum; membutuhkan better-sqlite3
npm run db:filter
```

Perintah di atas menulis **`data/database.sqlite`** (menimpa berkas lama jika ada). Agar aplikasi memakai berkas itu, arahkan backend ke path tersebut — misalnya di **`.env`**:

```bash
SQLITE_PATH=data/database.sqlite
```

Jika `SQLITE_PATH` tidak diatur, server default ke **`data/dashboard.sqlite`** (lihat `src/backend/config.js`).

### 2. Menjalankan aplikasi

Frontend dan backend disatukan dalam orkestrator Vite. Anda tidak perlu pindah-pindah folder atau menjalankan server Python.

**Produksi:**

```bash
npm install
npm run build && npm run start
```

**Pengembangan:**

```bash
npm run dev
```

**Docker (disarankan untuk deployment):**  
Anda bisa menjalankan aplikasi di container terisolasi dengan Docker Compose. Volume lokal `data`, `dataset`, dan `logs` di-mount; versi Node di dalam image.

1. **Jalankan container:**

```bash
docker-compose up -d --build
```

2. **Siapkan basis data (jika belum dari host):**  
Di dalam container sudah ada Node.js dan SQLite. Data bisa disiapkan langsung di container yang berjalan:

- **Opsi A (dataset mentah):** `docker exec -it nemesis npm run db:reset`
- **Opsi B (dump SQL):** `docker exec -it nemesis sh`, lalu jalankan perintah `sqlite3` seperti di atas.
- **Opsi C (subset Jawa Barat):** pastikan `data/dashboard.sqlite` ada di volume yang di-mount, lalu `docker exec -it nemesis npm run db:filter` dan atur `SQLITE_PATH=data/database.sqlite` di `.env` (atau environment container) bila ingin aplikasi memakai berkas hasil filter.

Server akan menyala otomatis. Buka URL lokal yang tercetak di terminal (biasanya `http://127.0.0.1:3000`).

## Catatan

- **`db:filter` dan Node:** `better-sqlite3` adalah modul native. Jika Anda mengganti versi utama Node.js, jalankan `npm rebuild better-sqlite3` (atau `npm install`) sebelum `npm run db:filter`.
- **Lintas platform:** Perintah terminal memakai `cross-env`. `npm run dev` dan `npm run start` bisa dijalankan di Linux, macOS, atau Windows.
- **Logging:** Node menulis log Apache harian terkompresi (`gzip`) ke folder `/logs` dengan rotasi untuk mengurangi risiko penuhnya disk saat trafik tinggi.
- Mode pengembangan tidak memerlukan build frontend manual; Vite menangani HMR.
- Untuk bundle produksi dan menjalankannya: `npm run build` lalu `npm run start`.

## Environment

Konfigurasi dibaca dari berkas `.env` di akar proyek.

Salin dari contoh:

```bash
cp .env.example .env
```
