document.addEventListener('DOMContentLoaded', () => {
  // Seleksi elemen DOM berdasarkan ID yang diberikan
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const modelSelect = document.getElementById('model-select');
  const chatBox = document.getElementById('chat-box');
  const submitButton = chatForm.querySelector('button[type="submit"]');
  const resetButton = document.getElementById('reset-button');

  // Variabel untuk menyimpan seluruh riwayat percakapan
  let conversationHistory = [];

  // Fungsi untuk mereset percakapan
  const resetChat = () => {
    conversationHistory = [];
    chatBox.innerHTML = '';
    appendMessage('bot', 'Halo! Aku Cerdas, asisten belajarmu. Ada yang bisa kubantu seputar Sejarah Indonesia?');
    userInput.focus();
  };

  // Event listener untuk tombol reset
  resetButton.addEventListener('click', resetChat);

  // Fungsi untuk scroll otomatis ke bawah chatbox
  const scrollToBottom = () => {
    chatBox.scrollTop = chatBox.scrollHeight;
  };

  // Fungsi untuk menampilkan pesan (User atau Bot)
  const appendMessage = (sender, text, isError = false) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    if (isError) {
      messageDiv.classList.add('error');
    }

    // Menggunakan textContent untuk keamanan (mencegah XSS injection)
    const senderLabel = sender === 'user' ? '<strong>Anda:</strong> ' : '<strong>SiCerdas:</strong> ';
    if (sender === 'bot') {
      // Parse response bot sebagai Markdown untuk menampilkan format seperti list, bold, dll.
      messageDiv.innerHTML = senderLabel + marked.parse(text);
    } else {
      messageDiv.innerHTML = `${senderLabel}${text}`;
    }

    chatBox.appendChild(messageDiv);
    scrollToBottom();
  };

  // Fungsi menampilkan indikator loading
  const showLoading = () => {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    // Beri kelas agar bisa di-style via CSS
    loadingDiv.className = 'message bot loading';
    loadingDiv.innerHTML = '<strong>Bot:</strong> <em>sedang berpikir...</em>';
    chatBox.appendChild(loadingDiv);
    scrollToBottom();
  };

  // Fungsi menghapus indikator loading
  const removeLoading = () => {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) loadingDiv.remove();
  };

  // Event Listener saat form disubmit
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    const model = modelSelect.value;

    if (!text) return; // Jangan kirim jika kosong

    // Tambahkan pesan user ke riwayat
    conversationHistory.push({ role: 'user', text: text });

    // 1. Tampilkan pesan user di chatbox
    appendMessage('user', text);
    userInput.value = ''; // Kosongkan input
    submitButton.disabled = true; // Cegah double submit


    // 2. Tampilkan loading
    showLoading();

    try {
      // 3. Kirim Request ke Backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: conversationHistory, // Kirim seluruh riwayat
          model: model,
        })
      });

      // 4. Hapus loading setelah respon diterima
      removeLoading();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 5. Tampilkan respon bot
      if (data && data.result) {
        const botResponse = data.result;
        appendMessage('bot', botResponse);
        // Tambahkan respon bot ke riwayat
        conversationHistory.push({ role: 'model', text: botResponse });
      } else {
        appendMessage('bot', 'Maaf, tidak ada respond yang diterima.', true);
      }

    } catch (error) {
      // 6. Error Handling
      removeLoading();
      console.error('Chat Error:', error);
      appendMessage('bot', 'Gagal mendapat respon dari server.', true);
    } finally {
      submitButton.disabled = false; // Aktifkan tombol kembali
      userInput.focus(); // Fokuskan kursor ke input
    }
  });

  // Tampilkan pesan selamat datang saat pertama kali dimuat
  resetChat();
});