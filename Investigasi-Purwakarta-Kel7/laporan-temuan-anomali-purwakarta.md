# Laporan Investigasi Anomali Anggaran
## Lokus Wilayah: Kabupaten Purwakarta
**Kontribusi Oleh: Kelompok [Nama Kelompok]**

---

### Ringkasan Eksekutif
Berdasarkan hasil pengolahan database **Nemesis (4.09 GB)** secara lokal, kelompok kami menemukan indikasi ketidakwajaran anggaran pada Kabupaten Purwakarta sebagai berikut:

* **Total Pagu Anggaran:** Rp 1,2 Triliun
* **Total Potensi Pemborosan:** Rp 2,1 Miliar
* **Status Investigasi:** Selesai (9.742 Paket Proyek Diidentifikasi)

### Temuan Utama (High Severity)
Kami mengidentifikasi beberapa paket proyek yang memiliki skor anomali tinggi:

1. **Paket 66092764 (Belanja Barang Dinas Perikanan):** Rp 147,5 Juta.
   - *Temuan:* Pengadaan berulang dan tidak selaras dengan tugas pokok dinas.
2. **Paket 64194450 (Belanja Tagihan Bapenda):** Rp 15,7 Juta.
   - *Temuan:* Penggunaan dana APBD untuk layanan digital non-dinas (Capcut & Google Drive).
3. **Paket 63387039 (Kebutuhan RT Wakil Kepala Daerah):** Rp 464,6 Juta.
   - *Temuan:* Komposisi item tidak esensial yang sangat beragam.

### Metodologi Kontribusi
Kelompok kami melakukan setup lingkungan kerja mandiri menggunakan:
- **Engine:** Nemesis Dashboard V2
- **Database:** SQLite (Local Setup)
- **Proses:** Audit Manual & Filtering Algoritma Anomali

---
*Laporan ini disusun untuk memenuhi tugas JP5 & Tugas 4 Pemrograman Berbasis Platform.*