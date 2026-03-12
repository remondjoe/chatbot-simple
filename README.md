# Chatbot Sederhana dengan Node.js + Gemini API

Ini adalah proyek chatbot sederhana yang dibangun menggunakan:
-   **Backend**: Node.js dengan Express.js
-   **Frontend**: Vanilla JavaScript, HTML, dan CSS.
-   **AI Model**: Google Gemini API.

Aplikasi ini memungkinkan pengguna untuk berinteraksi dengan model AI Gemini melalui antarmuka chat yang simpel dan responsif.

## Fitur

-   Antarmuka chat real-time.
-   Backend Express yang terhubung ke Gemini API.
-   Frontend Vanilla JS tanpa framework.
-   Pilihan model AI (Gemini 2.5 Flash, 1.5 Flash, 1.5 Pro).
-   Desain tema "sekolah" yang unik.
-   Penanganan status loading dan error.

## Prasyarat

-   [Node.js](https://nodejs.org/) (versi 18 atau lebih baru direkomendasikan)
-   `npm` atau `yarn`

## Cara Instalasi dan Menjalankan

1.  **Clone repository ini:**
    ```bash
    git clone <URL_REPOSITORY_ANDA>
    cd <NAMA_FOLDER_PROYEK>
    ```

2.  **Install dependensi:**
    Buka terminal di direktori proyek dan jalankan:
    ```bash
    npm install
    ```

3.  **Konfigurasi API Key:**
    Buat file baru bernama `.env` di direktori utama, lalu tambahkan API Key Anda. Dapatkan API Key dari Google AI Studio.
    ```env
    GEMINI_API_KEY="MASUKKAN_API_KEY_ANDA_DI_SINI"
    ```

4.  **Jalankan server:**
    ```bash
    node index.js
    ```

5.  **Buka aplikasi:**
    Buka browser dan akses alamat `http://localhost:3000`. Anda sekarang siap untuk berinteraksi dengan chatbot!
