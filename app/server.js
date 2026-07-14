const express = require('express');
const { Pool } = require('pg');
const session = require('express-session');

const app = express();
// Menerima input data berupa URL-encoded dan JSON (untuk API Fetch React)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'rahasia-super-kuat-dan-aman-sekali',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // Eksprirasi 1 hari
}));

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'login_db',
    password: process.env.DB_PASSWORD || 'secret',
    port: 5432,
});

// --- API ENDPOINTS UNTUK FRONTEND REACT ---

// Cek Status Sesi User saat halaman di-load
app.get('/api/session', (req, res) => {
    if (req.session.loggedIn) {
        res.json({ loggedIn: true, username: req.session.username });
    } else {
        res.json({ loggedIn: false });
    }
});

// Proses Login API
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

// Proses Logout API
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});


// --- SERVING FRONTEND REACT APPLICATION ---
app.get('*', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OneCycle Core - Secure Portal</title>
    <!-- React & Babel untuk memproses JSX di Browser -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <!-- Tailwind CSS untuk Desain Premium UI -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- FontAwesome untuk Icon Cantik -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 min-h-screen flex flex-col font-sans">

    <div id="root" class="min-h-screen flex flex-col justify-between"></div>

    <!-- Aplikasi React Utama -->
    <script type="text/transform-comment" data-presets="react">
        // Komponen di-render oleh Babel standalone secara dinamis
    </script>
    <script type="text/babel">
        const { useState, useEffect } = React;

        function App() {
            const [user, setUser] = useState(null);
            const [loading, setLoading] = useState(true);
            const [usernameInput, setUsernameInput] = useState('');
            const [passwordInput, setPasswordInput] = useState('');
            const [errorMsg, setErrorMsg] = useState('');
            const [authLoading, setAuthLoading] = useState(false);

            // Cek session saat pertama kali web dibuka
            useEffect(() => {
                fetch('/api/session')
                    .then(res => res.json())
                    .then(data => {
                        if (data.loggedIn) setUser(data.username);
                        setLoading(false);
                    })
                    .catch(() => setLoading(false));
            }, []);

            const handleLogin = async (e) => {
                e.preventDefault();
                setErrorMsg('');
                setAuthLoading(true);

                try {
                    const response = await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: usernameInput, password: passwordInput })
                    });
                    const data = await response.json();
                    
                    if (data.success) {
                        setUser(data.username);
                        setPasswordInput('');
                    } else {
                        setErrorMsg(data.message);
                    }
                } catch (err) {
                    setErrorMsg('Gagal terhubung ke server.');
                } finally {
                    setAuthLoading(false);
                }
            };

            const handleLogout = async () => {
                const response = await fetch('/api/logout', { method: 'POST' });
                const data = await response.json();
                if (data.success) setUser(null);
            };

            if (loading) {
                return (
                    <div class="flex items-center justify-center min-h-screen">
                        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                );
            }

            // TAMPILAN 1: HALAMAN LOGIN (MODERN & CANTIK)
            if (!user) {
                return (
                    <div class="flex-grow flex items-center justify-center p-4">
                        <div class="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-2xl shadow-2xl w-full max-w-md transition-all duration-300 transform hover:scale-[1.01]">
                            <div class="text-center mb-8">
                                <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white text-2xl shadow-lg shadow-indigo-500/20 mb-4">
                                    <i class="fa-solid md:fa-circle-nodes fa-arrows-spin animate-pulse"></i>
                                </div>
                                <h2 class="text-2xl font-bold tracking-tight text-white">OneCycle Portal</h2>
                                <p class="text-sm text-slate-400 mt-1">Silakan masuk ke infrastruktur CI/CD Anda</p>
                            </div>

                            {errorMsg && (
                                <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-5 flex items-center gap-2 animate-shake">
                                    <i class="fa-solid fa-circle-exclamation"></i>
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <form onSubmit={handleLogin} class="space-y-5">
                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Username</label>
                                    <div class="relative">
                                        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                            <i class="fa-solid fa-user"></i>
                                        </span>
                                        <input 
                                            type="text" 
                                            required
                                            value={usernameInput}
                                            onChange={(e) => setUsernameInput(e.target.value)}
                                            placeholder="Masukkan username Anda" 
                                            class="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
                                    <div class="relative">
                                        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                            <i class="fa-solid fa-lock"></i>
                                        </span>
                                        <input 
                                            type="password" 
                                            required
                                            value={passwordInput}
                                            onChange={(e) => setPasswordInput(e.target.value)}
                                            placeholder="••••••••" 
                                            class="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={authLoading}
                                    class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-sm py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                                >
                                    {authLoading ? (
                                        <div class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    ) : (
                                        <>
                                            <span>Sign In</span>
                                            <i class="fa-solid fa-arrow-right text-xs"></i>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                );
            }

            // TAMPILAN 2: HALAMAN DASHBOARD (PREMIUM SAAS DASHBOARD)
            return (
                <div class="flex-grow flex flex-col">
                    {/* Top Navigation */}
                    <header class="bg-slate-900/40 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-500/10">
                                <i class="fa-solid fa-layer-group"></i>
                            </div>
                            <span class="font-bold tracking-wide text-white">OneCycle Control Center</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <span class="text-sm text-slate-300 flex items-center gap-2">
                                <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                User: <strong class="text-white font-medium">{user}</strong>
                            </span>
                            <button 
                                onClick={handleLogout}
                                class="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 px-4 rounded-lg border border-slate-700 transition-all flex items-center gap-2"
                            >
                                <i class="fa-solid fa-right-from-bracket"></i>
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </header>

                    {/* Dashboard Content Area */}
                    <main class="flex-grow p-6 max-w-7xl w-full mx-auto space-y-6">
                        {/* Welcome Banner */}
                        <div class="bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-slate-900/60 border border-indigo-500/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div class="relative z-10">
                                <h1 class="text-2xl font-bold text-white">Selamat Datang kembali, {user}!</h1>
                                <p class="text-sm text-indigo-200/70 mt-1 max-w-xl">Seluruh pipa otomatisasi CI/CD berjalan lancar. Kode Anda bersih dari bug dan siap melayani lalu lintas produksi.</p>
                            </div>
                            <i class="fa-solid fa-cubes absolute right-6 bottom-0 text-8xl text-indigo-500/5 select-none pointer-events-none transform translate-y-4"></i>
                        </div>

                        {/* Status Grid Components */}
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Card 1: SonarQube */}
                            <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <p class="text-xs font-semibold tracking-wider text-slate-400 uppercase">SonarQube Engine</p>
                                        <h3 class="text-lg font-bold text-white mt-1">Code Quality Gate</h3>
                                    </div>
                                    <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
                                        <i class="fa-solid fa-circle-check text-[10px]"></i> Passed
                                    </span>
                                </div>
                                <div class="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                                    <span>Bugs terdeteksi: <strong>0</strong></span>
                                    <a href="http://localhost:9000" target="_blank" class="text-indigo-400 hover:underline">Buka Report <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a>
                                </div>
                            </div>

                            {/* Card 2: Jenkins */}
                            <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <p class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Jenkins Automation</p>
                                        <h3 class="text-lg font-bold text-white mt-1">Pipeline Status</h3>
                                    </div>
                                    <span class="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
                                        <i class="fa-solid fa-circle-nodes text-[10px]"></i> Connected
                                    </span>
                                </div>
                                <div class="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                                    <span>Pemicu: <strong>Git Push Webhook</strong></span>
                                    <a href="http://localhost:8080" target="_blank" class="text-indigo-400 hover:underline">Buka Jenkins <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a>
                                </div>
                            </div>

                            {/* Card 3: Database */}
                            <div class="bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <p class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Infrastructure Data</p>
                                        <h3 class="text-lg font-bold text-white mt-1">PostgreSQL Core</h3>
                                    </div>
                                    <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
                                        <i class="fa-solid fa-database text-[10px]"></i> Healthy
                                    </span>
                                </div>
                                <div class="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                                    <span>Koneksi Pool: <strong>Aktif</strong></span>
                                    <span class="text-slate-500">Port 5432</span>
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* Footer */}
                    <footer class="bg-slate-950/40 border-t border-slate-900/60 text-center py-4 text-xs text-slate-500">
                        &copy; 2026 OneCycle CI/CD Suite. All privileges verified.
                    </footer>
                </div>
            );
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));