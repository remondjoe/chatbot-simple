document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const apiKey = document.getElementById('apiKey').value;
    const errorMessage = document.getElementById('error-message');

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, apiKey })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registrasi gagal.');
        }

        alert('Registrasi berhasil! Silakan login.');
        window.location.href = '/login.html';

    } catch (error) {
        errorMessage.textContent = error.message;
    }
});