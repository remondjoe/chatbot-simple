document.addEventListener('DOMContentLoaded', () => {
  // Seleksi elemen DOM berdasarkan ID yang diberikan
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const modelSelect = document.getElementById('model-select');
  const subjectSelect = document.getElementById('subject-select');
  const chatBox = document.getElementById('chat-box');
  const submitButton = chatForm.querySelector('button[type="submit"]');
  const authStatusDiv = document.getElementById('auth-status');

  // Variabel untuk menyimpan seluruh riwayat percakapan
  let conversationHistory = [];

  // Fungsi untuk mengelola tampilan UI berdasarkan status login
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/me');
      if (response.ok) {
        const user = await response.json();
        authStatusDiv.innerHTML = `
          <span>Halo, ${user.username}! | <a href="/dashboard.html">Dashboard</a> | <a href="/apikey-guide.html" target="_blank">Bantuan</a></span>
          <button id="reset-button" title="Mulai percakapan baru">Reset Chat</button>
        `;
      } else {
        authStatusDiv.innerHTML = `
          <span>Tamu | <a href="/login.html">Login</a> | <a href="/register.html">Daftar</a> | <a href="/apikey-guide.html" target="_blank" title="Cara dapat API Key">Bantuan</a></span>
          <button id="reset-button" title="Mulai percakapan baru">Reset Chat</button>
        `;
      }
    } catch (error) {
      console.error('Gagal memeriksa status autentikasi:', error);
    }
    document.getElementById('reset-button').addEventListener('click', resetChat);
  };

  // Fungsi untuk mengambil dan menampilkan versi build
  const fetchBuildVersion = async () => {
    try {
      const response = await fetch('/api/version');
      if (response.ok) {
        const data = await response.json();
        const buildEl = document.getElementById('build-version');
        if (buildEl) buildEl.textContent = data.version;
      }
    } catch (error) { console.error('Gagal memuat versi:', error); }
  };

  // Fungsi untuk mereset percakapan
  const resetChat = () => {
    conversationHistory = [];
    chatBox.innerHTML = '';
    // Ambil nama mapel yang sedang dipilih untuk sapaan
    const subjectText = subjectSelect.options[subjectSelect.selectedIndex].text;
    appendMessage('bot', `Halo! Aku Cerdas, asisten belajar ${subjectText}mu. Ada yang bisa kubantu?`);
    userInput.focus();
  };

  // Reset chat otomatis jika user mengganti mapel agar konteks tidak tercampur
  subjectSelect.addEventListener('change', resetChat);

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

      // Setelah HTML di-render, cari blok kode dan tambahkan tombol copy
      messageDiv.querySelectorAll('pre').forEach(pre => {
        const code = pre.querySelector('code');
        if (!code) return;

        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-button';
        copyButton.innerText = 'Copy';
        copyButton.title = 'Salin kode';

        copyButton.addEventListener('click', () => {
          navigator.clipboard.writeText(code.innerText).then(() => {
            copyButton.innerText = 'Disalin!';
            setTimeout(() => {
              copyButton.innerText = 'Copy';
            }, 2000);
          }).catch(err => {
            console.error('Gagal menyalin kode: ', err);
          });
        });

        pre.appendChild(copyButton);
      });

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
    const subject = subjectSelect.value;

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
          subject: subject,
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
  checkAuthStatus();
  fetchBuildVersion();
  resetChat();
});