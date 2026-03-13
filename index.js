import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { GoogleGenAI } from '@google/genai';

const app = express();
const serverAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = "gemini-2.5-flash";

// Konfigurasi path untuk ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE_PATH = path.join(__dirname, 'users.json');
let users = []; // Data pengguna akan dimuat ke sini dari file

// Fungsi pembantu untuk membaca dan menulis file pengguna
const readUsersFromFile = async () => {
  try {
    const data = await fs.readFile(USERS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') { // Jika file tidak ada, mulai dengan array kosong
      return [];
    }
    throw error;
  }
};

const writeUsersToFile = async (usersData) => {
  await fs.writeFile(USERS_FILE_PATH, JSON.stringify(usersData, null, 2));
};

app.use(cors());
app.use(express.json());

// Konfigurasi Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-super-secret-key', // Ganti dengan secret yang kuat di .env
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set 'true' jika menggunakan HTTPS
}));

// Middleware untuk menyajikan file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  const { conversation, model, subject } = req.body;

  // Definisi instruksi untuk setiap mapel
  const instructions = {
    sejarah: `Kamu adalah "Cerdas", asisten belajar Sejarah yang asik. Jelaskan peristiwa sejarah, tokoh, dan dampaknya dengan bahasa yang mudah dimengerti siswa.`,
    indonesia: `Kamu adalah "Cerdas", asisten belajar Bahasa Indonesia. Bantu pengguna dengan tata bahasa (PUEBI), majas, struktur teks, dan literatur Indonesia.`,
    matematika: `Kamu adalah "Cerdas", asisten belajar Matematika. Jawablah soal dengan langkah-langkah penyelesaian (step-by-step) yang jelas. Jangan langsung memberikan jawaban akhir.`,
    inggris: `Kamu adalah "Cerdas", asisten belajar Bahasa Inggris. Bantu dengan grammar, vocabulary, dan translation. Kamu bisa menjawab dalam campuran Bahasa Inggris dan Indonesia untuk edukasi.`,
    default: `Kamu adalah "Cerdas", asisten belajar sekolah yang ramah dan siap membantu berbagai mata pelajaran.`
  };

  // Tentukan AI instance mana yang akan digunakan
  let activeAi = serverAi; // Default menggunakan API Key server (untuk guest)
  if (req.session.user && req.session.user.apiKey) {
    // Jika user login dan punya API key, gunakan key milik user
    activeAi = new GoogleGenAI({ apiKey: req.session.user.apiKey });
  }

  try {
    if (!Array.isArray(conversation)) {
      throw new Error('Messages must be an array!');
    }

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }]
    }));

    const response = await activeAi.models.generateContent({
      model: model || GEMINI_MODEL,
      contents: contents,
      config: {
        temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.9,
        topP: parseFloat(process.env.AI_TOP_P) || 0.95,
        topK: parseInt(process.env.AI_TOP_K) || 40,
        // Pilih instruksi berdasarkan subject, atau gunakan default jika tidak ada
        systemInstruction: instructions[subject] || instructions.default,
      },
    });

    res.status(200).json({
      result: response.response.text()
    });

  } catch (e) {
    res.status(500).json({
      error: e.message
    });
  }
});

// --- Endpoint Autentikasi ---

app.post('/api/register', async (req, res) => {
  const { username, password, apiKey } = req.body;
  if (!username || !password || !apiKey) {
    return res.status(400).json({ error: 'Username, password, dan API Key diperlukan.' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username sudah digunakan.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { username, hashedPassword, apiKey };
  users.push(newUser);
  await writeUsersToFile(users); // Simpan array pengguna yang sudah diupdate ke file
  console.log('User terdaftar dan disimpan:', username);
  res.status(201).json({ message: 'Registrasi berhasil!' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  const isMatch = await bcrypt.compare(password, user.hashedPassword);
  if (!isMatch) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  // Simpan info user di session
  req.session.user = {
    username: user.username,
    apiKey: user.apiKey
  };

  res.status(200).json({ message: 'Login berhasil!' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Gagal logout.' });
    }
    res.clearCookie('connect.sid'); // Hapus cookie session
    res.status(200).json({ message: 'Logout berhasil.' });
  });
});

app.post('/api/change-password', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Anda harus login terlebih dahulu.' });
  }

  const { oldPassword, newPassword } = req.body;
  const userIndex = users.findIndex(u => u.username === req.session.user.username);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User tidak ditemukan.' });
  }

  const user = users[userIndex];
  const isMatch = await bcrypt.compare(oldPassword, user.hashedPassword);

  if (!isMatch) {
    return res.status(400).json({ error: 'Password lama salah.' });
  }

  users[userIndex].hashedPassword = await bcrypt.hash(newPassword, 10);
  await writeUsersToFile(users);
  
  res.status(200).json({ message: 'Password berhasil diubah!' });
});

// Endpoint untuk mendapatkan data user yang sedang login
app.get('/api/me', (req, res) => {
  if (req.session.user) {
    // Jangan kirim password atau data sensitif lainnya
    res.status(200).json({
      username: req.session.user.username,
      apiKey: req.session.user.apiKey, // Untuk ditampilkan di dashboard
    });
  } else {
    res.status(401).json({ error: 'Tidak terautentikasi' });
  }
});

// Endpoint untuk mendapatkan versi build dari .env
app.get('/api/version', (req, res) => {
  res.json({ version: process.env.BUILD_VERSION || 'v1.0.0' });
});

const PORT = 3000;

// Fungsi untuk memulai server setelah memuat data pengguna
const startServer = async () => {
  try {
    users = await readUsersFromFile();
    app.listen(PORT, () =>
      console.log(`Server ready on http://localhost:${PORT}, loaded ${users.length} users.`)
    );
  } catch (error) {
    console.error("Gagal memulai server:", error);
    process.exit(1);
  }
};

startServer();