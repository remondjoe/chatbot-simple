document.addEventListener('DOMContentLoaded', async () => {
    const userInfoDiv = document.getElementById('user-info');
    const logoutButton = document.getElementById('logout-button');

    try {
        const response = await fetch('/api/me');
        if (!response.ok) {
            window.location.href = '/login.html'; // Redirect jika belum login
            return;
        }
        const user = await response.json();
        userInfoDiv.innerHTML = `
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>API Key Anda:</strong> <span class="api-key">${user.apiKey}</span></p>
        `;
    } catch (error) {
        userInfoDiv.innerHTML = `<p class="error-text">Gagal memuat data pengguna.</p>`;
    }

    logoutButton.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            alert('Anda telah logout.');
            window.location.href = '/';
        } catch (error) {
            alert('Gagal logout.');
        }
    });
});