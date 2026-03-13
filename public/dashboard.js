document.addEventListener('DOMContentLoaded', async () => {
    const userInfoDiv = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-button');

    // 1. Ambil Data User
    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            const user = await response.json();
            userInfoDiv.innerHTML = `
                <p><strong>Username:</strong> ${user.username}</p>
                <p><strong>API Key:</strong> <span class="api-key">${user.apiKey || 'Default Server'}</span></p>
            `;
        } else {
            // Jika tidak login, kembalikan ke halaman login
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
        userInfoDiv.innerHTML = '<p style="color:red">Gagal memuat data.</p>';
    }

    // 2. Handler Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/logout', { method: 'POST' });
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Logout error:', error);
                alert('Gagal logout');
            }
        });
    }

    // 3. Handler Ganti Password
    const changePassForm = document.getElementById('change-password-form');
    const msgDiv = document.getElementById('msg-password');

    if (changePassForm) {
        changePassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPassword = document.getElementById('old-password').value;
            const newPassword = document.getElementById('new-password').value;

            msgDiv.textContent = 'Memproses...';
            msgDiv.style.color = '#333';

            try {
                const res = await fetch('/api/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ oldPassword, newPassword })
                });

                const data = await res.json();

                if (res.ok) {
                    msgDiv.style.color = 'green';
                    msgDiv.textContent = 'Password berhasil diubah!';
                    changePassForm.reset();
                } else {
                    msgDiv.style.color = 'red';
                    msgDiv.textContent = data.error || 'Gagal mengubah password.';
                }
            } catch (err) {
                msgDiv.textContent = 'Terjadi kesalahan sistem.';
            }
        });
    }
});