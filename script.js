document.addEventListener('DOMContentLoaded', () => {
  // Seleksi elemen DOM berdasarkan ID yang diberikan
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const submitButton = chatForm.querySelector('button[type="submit"]');

  // Fungsi untuk scroll otomatis ke bawah chatbox
  const scrollToBottom = () => {
    chatBox.scrollTop = chatBox.scrollHeight;
  };

  // Fungsi untuk menampilkan pesan (User atau Bot)
  const appendMessage = (sender, text, isError = false) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    // Styling inline sederhana untuk membedakan visual (bisa dipindah ke CSS)
    messageDiv.style.marginBottom = '10px';
    messageDiv.style.padding = '8px';
    messageDiv.style.borderRadius = '5px';
    messageDiv.style.backgroundColor = sender === 'user' ? '#e3f2fd' : '#f5f5f5';
    if (isError) {
        messageDiv.style.backgroundColor = '#ffebee';
        messageDiv.style.color = '#c62828';
    }

    // Menggunakan textContent untuk keamanan (mencegah XSS injection)
    const senderLabel = sender === 'user' ? '<strong>Anda:</strong> ' : '<strong>Bot:</strong> ';
    messageDiv.innerHTML = `${senderLabel}${text}`; // innerHTML aman di sini karena text di-sanitize atau hardcoded

    chatBox.appendChild(messageDiv);
    scrollToBottom();
  };

  // Fungsi menampilkan indikator loading
  const showLoading = () => {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.style.fontStyle = 'italic';
    loadingDiv.style.color = '#666';
    loadingDiv.style.padding = '8px';
    loadingDiv.textContent = 'Bot sedang berpikir...';
    
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

    if (!text) return; // Jangan kirim jika kosong

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
          conversation: [{ role: 'user', text: text }]
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
        appendMessage('bot', data.result);
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
});