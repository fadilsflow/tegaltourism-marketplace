**Product Requirements Document (PRD)**
**Fitur: Iklan di Hero Section dengan Reward Coin**

---

# 1. Overview

Fitur ini memungkinkan pengguna melihat iklan di hero section aplikasi. Saat pengguna mengklik iklan, mereka berhak mendapatkan reward berupa coin. Sistem harus menjaga agar reward hanya diberikan ketika syarat terpenuhi, serta menyediakan admin panel untuk mengelola konten iklan.

---

# 2. Objectives

* Menyediakan mekanisme penayangan iklan pada hero section.
* Memberikan reward coin secara aman ketika pengguna berinteraksi dengan iklan.
* Memberikan admin kemampuan penuh untuk membuat, mengatur, dan memonitor iklan.
* Menyediakan metrik dasar performa iklan untuk keperluan analisis.

---

# 3. User Stories

### 3.1 Pengguna (User)

* Sebagai pengguna, saya ingin melihat iklan di hero section.
* Sebagai pengguna, saya ingin mendapatkan coin saat saya mengklik iklan.
* Sebagai pengguna, saya ingin mengetahui apakah reward berhasil diklaim.

### 3.2 Admin

* Sebagai admin, saya ingin membuat iklan baru (gambar, judul, deskripsi, link, reward coin, masa aktif, quota jika ada).
* Sebagai admin, saya ingin mengedit konten iklan.
* Sebagai admin, saya ingin menonaktifkan atau menghapus iklan.
* Sebagai admin, saya ingin mengecek performa iklan (jumlah klik, klaim reward, CTR, sisa quota).
* Sebagai admin, saya ingin mengatur urutan penayangan iklan.

---

# 4. Functional Requirements

## 4.1 User-Side Functionality

1. Sistem menampilkan satu atau beberapa iklan aktif di hero section.
2. Saat pengguna mengklik iklan, frontend mengirim request ke backend:

   * `POST /ads/{adId}/claim`
3. Backend memvalidasi:

   * Iklan aktif.
   * Pengguna belum pernah klaim iklan ini.
   * Iklan belum melewati quota (jika diaktifkan).
4. Bila valid, backend:

   * Memberikan coin ke pengguna.
   * Mencatat klaim pada log.
   * Mengembalikan status sukses.
5. Jika tidak valid, backend mengembalikan alasan (misal sudah klaim sebelumnya).

---

## 4.2 Admin-Side Functionality

### A. Manajemen Iklan (CRUD)

* **Create**
  Field wajib:

  * Judul
  * Deskripsi
  * Gambar (upload)
  * URL tujuan
  * Reward coin
  * Start date
  * End date
  * Quota (opsional)
  * Status (draft/published)

* **Read**

  * List iklan lengkap dengan filter (status, tanggal, dll.)

* **Update**

  * Perubahan data iklan kapan saja kecuali ID.

* **Delete/Archive**

  * Opsi untuk menyembunyikan iklan tanpa menghapus data historis.

### B. Statistik Iklan

* Jumlah impresi (setiap iklan ditampilkan).
* Jumlah klik.
* Jumlah klaim.
* CTR: `klik / impresi`.
* Sisa quota reward (jika quota digunakan).

### C. Control & Ordering

* Toggle publish/unpublish.
* Mengatur urutan iklan (drag & drop atau numeric ordering).

---

# 5. Data Model (High-Level)

### Table: `ads`

* `id`
* `title`
* `description`
* `image_url`
* `target_url`
* `reward_coin`
* `start_date`
* `end_date`
* `quota` (nullable)
* `status` (draft/published)
* `sort_order`
* `created_at` / `updated_at`

### Table: `ad_claims`

* `id`
* `ad_id`
* `user_id`
* `claimed_at`

### Table: `wallet_transactions`

* `id`
* `user_id`
* `amount`
* `type` (reward_ad)
* `ad_id`
* `created_at`

### Table: `ad_metrics` (opsional, bisa dihitung otomatis)

* `impressions`
* `clicks`
* `claims`

---

# 6. API Requirements

### Public APIs

1. `GET /ads/active`
   Mengambil list iklan yang aktif dan siap ditampilkan.

2. `POST /ads/{adId}/claim`
   Validasi & klaim reward.

### Admin APIs

1. `POST /admin/ads`
2. `PUT /admin/ads/{adId}`
3. `DELETE /admin/ads/{adId}`
4. `GET /admin/ads`
5. `GET /admin/ads/{adId}/stats`
6. `PUT /admin/ads/order`

---

# 7. Security & Validation

* Reward hanya bisa diproses oleh backend.
* Setiap klaim harus menggunakan user token valid.
* Satu pengguna hanya bisa klaim satu kali per iklan.
* Harus ada rate limit pada endpoint klaim.

---

# 8. Non-functional Requirements

* **Performance:** Hero section harus dapat mengambil data iklan dalam <150ms dari service.
* **Scalability:** Sistem harus mampu menangani penalaman traffic tinggi pada event tertentu.
* **Reliability:** Reward tidak boleh double-claim walaupun ada race condition.
* **Auditability:** Semua klaim dan transaksi coin harus memiliki log.

---

# 9. Acceptance Criteria

### Frontend

* Iklan tampil sesuai urutan.
* Klik membuka link target dan memicu reward claim.
* Notifikasi klaim berhasil muncul.

### Backend

* Reward diberikan hanya ketika valid.
* Semua klaim tercatat.
* Admin dapat membuat, mengedit, menghapus, serta memantau iklan.
* Statistik mencerminkan penggunaan aktual.

---

Kalau kamu butuh versi yang lebih teknis (misalnya breakdown task per sprint, API contract detail, atau flow diagram sequence), tinggal bilang saja.
