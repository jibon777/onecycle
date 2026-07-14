const express = require('express');
const { Pool } = require('pg');
const session = require('express-session');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// PENTING: Mengaktifkan penyajian otomatis file frontend statis dari folder public
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'rahasia-super-kuat-dan-aman-sekali',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'login_db',
    password: process.env.DB_PASSWORD || 'secret',
    port: 5432,
});

// --- PURE API ENDPOINTS ---

app.get('/api/session', (req, res) => {
    if (req.session.loggedIn) {
        res.json({ loggedIn: true, username: req.session.username });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        if (result.rows.length > 0) {
            req.session.loggedIn = true;
            req.session.username = username;
            return res.json({ success: true, username: username });
        }
        res.status(401).json({ success: false, message: 'Username atau password salah!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Terjadi gangguan pada server database.' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

// Mengalihkan semua request rute navigasi lain langsung ke frontend React SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));