# Contoh Transkrip Rapat untuk Pengujian AI PRD Generator

Berikut adalah contoh-contoh teks transkrip percakapan rapat yang bisa Anda gunakan untuk menguji sistem (Copy-Paste teks di bawah ini ke dalam kotak input aplikasi).

---

## 🟢 Contoh 1: Transkrip Rapat VALID (Bisa Dieksekusi)
Transkrip ini berisi pembahasan fitur spesifik, alur pengguna (user flow), dan kebutuhan teknis sebuah aplikasi.

> **Budi (Product Manager):** Halo tim, agenda kita hari ini adalah membahas modul baru untuk aplikasi e-commerce kita, yaitu fitur "Split Bill" atau patungan pembayaran di dalam aplikasi. Tujuannya agar pengguna bisa patungan saat memesan makanan atau belanja bareng kelompok.
> 
> **Siti (UI/UX Designer):** Oke Mas Budi, dari sisi desain saya membayangkan nanti di halaman checkout akan ada tombol baru bernama "Bayar Pakai Split Bill". Begitu diklik, pengguna bisa memilih kontak teman yang juga pakai aplikasi ini, lalu memasukkan nominal pembagiannya (bisa dibagi rata atau kustom). Konsep kasarnya nanti berbentuk daftar vertikal dengan foto profil teman dan kolom input nominal di sebelahnya.
> 
> **Rian (Backend Developer):** Berarti dari sisi API, saya harus membuat endpoint baru untuk mengenerate payment link unik untuk setiap anggota patungan. Status transaksi utama tidak akan berubah menjadi 'Paid' sampai semua anggota menyelesaikan pembayaran mereka. Oh ya, kita juga butuh sistem real-time notification atau push notif ke HP teman yang ditunjuk agar mereka tahu ada tagihan masuk.
> 
> **Budi (Product Manager):** Bagus. Untuk tahap awal (MVP), batas maksimal teman yang bisa diajak patungan kita batasi maksimal 5 orang dulu ya untuk menjaga performa server. Tolong buatkan dokumen ini agar tim bisa langsung eksekusi sprint depan.

---

## 🔴 Contoh 2: Transkrip Rapat TIDAK VALID (Aman dari Crash)
Transkrip ini berisi percakapan kasual sehari-hari yang sama sekali tidak berhubungan dengan pengembangan sistem atau produk digital. Digunakan untuk menguji apakah sistem AI kita cerdas dalam menolak (graceful fallback).

> **Andi:** Eh guys, makan siang nanti mau makan di mana nih? Cuaca lagi mendung banget begini enaknya makan yang anget-anget dan berkuah gak sih?
> 
> **Maya:** Boleh juga tuh Ndi. Gimana kalau kita makan Bakso Pak Min yang di dekat pertigaan depan kantor? Di sana kuahnya kaldu banget, terus sambalnya mantap.
> 
> **Dedi:** Waduh, jangan Bakso Pak Min deh, kemarin siang aku baru saja makan bakso di sana sama tim marketing. Gimana kalau Seblak Jeletot aja? Biar pedasnya nampol dan bikin mata seger lagi setelah pusing kerja seharian.
> 
> **Maya:** Wah, aku lagi gak bisa makan pedas nih, perutku lagi agak sensitif dari kemarin. Kita ambil jalan tengah aja gimana? Makan di rumah makan Padang seberang jalan, pilihannya banyak dan tempatnya luas jadi bisa sekalian ngobrol santai.
> 
> **Andi:** Ya sudah, sepakat rumah makan Padang aja ya. Jam 12 teng kita langsung jalan biar gak kehabisan rendangnya!
