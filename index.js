import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = "gemini-2.5-flash";
app.use(cors());
app.use(express.json());

// Konfigurasi path untuk ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware untuk menyajikan file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  const { conversation, model } = req.body;

  try {
    if (!Array.isArray(conversation)) {
      throw new Error('Messages must be an array!');
    }

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }]
    }));

    const response = await ai.models.generateContent({
      model: model || GEMINI_MODEL,
      contents: contents,
      config: {
        temperature: 0.9,
        // Instruksi sistem yang lebih spesifik untuk "Education Bot"
        systemInstruction: `Kamu adalah "Cerdas", seorang asisten belajar Sejarah Indonesia yang ramah dan ceria. 
        Gunakan gaya bahasa yang mudah dimengerti untuk siswa SMP atau SMA. 
        Selalu jawab dalam Bahasa Indonesia. 
        Jika pertanyaan di luar topik sejarah, tolak dengan sopan dan ajak kembali untuk membahas sejarah.`,
      },
    });

    res.status(200).json({
      result: response.text
    });

  } catch (e) {
    res.status(500).json({
      error: e.message
    });
  }
});
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`Server ready on http://localhost:${PORT}`)
);