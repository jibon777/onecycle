const express = require('express');
const { Pool } = require('pg');
const session = require('express-session');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'rahasia-super-kuat',
    resave: false,
    saveUninitialized: true
}));

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'login_db',
    password: process.env.DB_PASSWORD || 'secret',
    port: 5432,
});

// UI Halaman Login
app.get('/', (req, res) => {
    if (req.session.loggedIn) return res.redirect('/dashboard');
    res.send(`
        <h2>Login Form</h2>
        <form action="/login" method="POST">
            <input type="text" name="username" placeholder="Username" required><br><br>
            <input type="password" name="password" placeholder="Password" required><br><br>
            <button type="submit">Login</button>
        </form>
    `);
});

// Logika Validasi Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        if (result.rows.length > 0) {
            req.session.loggedIn = true;
            req.session.username = username;
            return res.redirect('/dashboard');
        }
        res.send('Username atau password salah! <a href="/">Kembali</a>');
    } catch (err) {
        console.error(err);
        res.status(500).send('Terjadi kesalahan pada server.');
    }
});

// Dashboard Utama
app.get('/dashboard', (req, res) => {
    if (!req.session.loggedIn) return res.redirect('/');
    res.send(`
        <h2>Selamat Datang, ${req.session.username}!</h2>
        <p>Anda berhasil masuk ke sistem.</p>
        <a href="/logout"><button>Logout</button></a>
    `);
});

// Logika Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// SIMULASI BUG UNTUK TESTING SONARQUBE
function fiturKalkulatorRusak() {
    // Bug 1: Infinite loop yang bikin server hang (CPU 100%)
    for (let i = 0; i < 10; i--) { 
        console.log("Looping abadi karena i malah berkurang");
    }

    // Bug 2: Membandingkan variabel yang sama (logika eror)
    let nama = "admin";
    if (nama === nama) { 
        return true;
    }
    
    // Bug 3: Kode mati yang tidak akan pernah dieksekusi
    console.log("Kode hantu, tidak mungkin sampai sini"); 
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));