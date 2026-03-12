document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/version');
        if (response.ok) {
            const data = await response.json();
            const buildEl = document.getElementById('build-version');
            if (buildEl) buildEl.textContent = data.version;
        }
    } catch (error) { console.error('Gagal memuat versi:', error); }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login gagal.');
        }

        window.location.href = '/'; // Redirect ke halaman chat utama

    } catch (error) {
        errorMessage.textContent = error.message;
    }
});