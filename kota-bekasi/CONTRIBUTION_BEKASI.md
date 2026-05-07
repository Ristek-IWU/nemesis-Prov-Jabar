# Laporan Kontribusi Project Nemesis (JP5)
## Lokus Wilayah: Kota Bekasi
**Tanggal:** 7 Mei 2026
**Kontributor:** Kelompok8

---

## 1. Pendahuluan
Laporan ini disusun sebagai pemenuhan **Tugas 4** secara individu untuk mendokumentasikan kontribusi teknis dalam pengembangan **Project Nemesis**. Fokus kontribusi dilakukan pada integrasi data audit pengadaan untuk wilayah **Kota Bekasi** tahun anggaran 2026.

## 2. Lingkup Kontribusi (Technical Contributions)
Saya bertanggung jawab atas beberapa komponen kunci pada modul Kota Bekasi, antara lain:

### A. Data Visualization & Statistics
Melakukan pemetaan data statistik kunci pada dashboard utama wilayah Bekasi yang mencakup:
* **Analisis Potensi Pemborosan:** Rp 10.0 Miliar.
* **Aggregasi Pagu Anggaran:** Rp 3.0 Triliun dari total 14.492 paket.
* **Klasifikasi Severity:** Identifikasi 28 paket dengan status *Severity High* dan 1 paket *Severity Absurd*.

### B. Feature Implementation: Filtering System
Mengimplementasikan fungsi filter dinamis pada komponen UI untuk memisahkan paket berdasarkan entitas pemilik:
* **Kementerian/Lembaga:** (2.092 paket)
* **Pemprov:** (77 paket)
* **Pemkot Bekasi:** (12.323 paket)
* **Lainnya (Others):** (0 paket)

### C. Audit Detail & Reasoning Integration
Menyusun dan mengintegrasikan rincian paket bermasalah ke dalam tabel audit, termasuk pengisian kolom **Alasan (Reasoning)** untuk memberikan konteks pada temuan audit, seperti:
* **Belanja Sewa Alat Rumah Tangga (Sekretariat DPRD):** Rp 5.228.888.080 (Severity: High).
* **Belanja Perjalanan Dinas Luar Negeri:** Rp 1.318.571.115 (Severity: High).
* **Pengadaan Suvenir/Cendera Mata:** Rp 80.000.000 (Severity: High).

## 3. Workflow & Kolaborasi Repositori
Sesuai instruksi proyek, kontribusi dilakukan pada repositori pusat Nemesis dengan prosedur sebagai berikut:
1. **Pulling Updates:** Melakukan sinkronisasi rutin dengan `origin main` untuk menghindari conflict dengan kelompok wilayah lain.
2. **Local Development:** Melakukan slicing UI dan penyesuaian komponen Tailwind CSS agar selaras dengan tema dark mode proyek.
3. **Commit Strategy:** Menggunakan pesan commit yang deskriptif untuk memudahkan tracking oleh instruktur 

## 4. Penutup
Kontribusi telah berhasil di-push ke repositori utama dan telah divalidasi melalui pratinjau lokal. Seluruh fungsionalitas untuk wilayah Kota Bekasi siap untuk tahap hosting bersama.

---
**Status Proyek:** Selesai (Ready for Deployment).
