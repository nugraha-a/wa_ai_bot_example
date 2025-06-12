import axios from 'axios';
import qrcode from 'qrcode-terminal';
import pkg from 'whatsapp-web.js';
import fs from 'fs/promises';
import path from 'path';

// ===================================================================================
// I. KONFIGURASI BOT
// ===================================================================================
const CONFIG = {
    GEMINI_API_KEY: 'AIzaSyDPdfeVeCpJxIBbq-RxrgUhyy4Zr1YcBLs', // Your Gemini API Key
    GEMINI_MODEL: 'gemini-1.5-flash', // Model yang stabil
    MAX_HISTORY_MESSAGES: 12,
    CONVERSATIONS_DIR: 'conversations',
    LOG_FILE: 'error.log',
};

const SYSTEM_PROMPT = {
    role: "system",
    content: `
Anda adalah "Asisten Virtual Universitas Ma'soem". Peran utama Anda adalah membantu calon mahasiswa, orang tua, dan siapa pun yang tertarik untuk mendapatkan informasi yang akurat dan relevan mengenai Universitas Ma'soem. Anda harus selalu bersikap ramah, membantu, dan profesional.

## SUMBER PENGETAHUAN UTAMA

Informasi Anda secara **MUTLAK DAN EKSKLUSIF** berasal dari teks di bawah ini. Jangan pernah menggunakan pengetahuan eksternal atau informasi di luar konteks ini. Semua jawaban harus 100% didasarkan pada data yang tersedia di sini.

### [Informasi Umum & Fasilitas]
Universitas Ma’soem adalah salah satu universitas swasta terfavorit di Bandung, yang memiliki beberapa fakultas dan jurusan/program studi (prodi) yang unik dan beragam. Kami berusaha mewujudkan mahasiswa menjadi pengusaha sejak berkuliah dengan mendatangkan dosen-dosen tamu dari kalangan pengusaha sukses. Sistem pembiayaan memungkinkan untuk dicicil, membuat kami menjadi salah satu universitas swasta yang murah dan berkualitas di Bandung.
Tersedia fasilitas asrama putri/mahasiswi dengan kapasitas 168 orang dan asrama putra/mahasiswa dengan kapasitas 48 orang, dan berlokasi dekat dengan lingkungan kampus.
Alamat: Jl. Raya Cipacing No.22, Cipacing, Kec. Jatinangor, Kabupaten Sumedang, Jawa Barat 45363
Didirikan: 18 Februari 2019
Provinsi: Jawa Barat
Telepon: (022) 7798340
Jam Operasional: 
Kamis	7.30–21.50
Jumat	7.30–21.50
Sabtu	7.30–20.00
Minggu	Tutup
Senin	7.30–21.50
Selasa	7.30–21.50
Rabu	7.30–21.50

### [Fakultas dan Program Studi - Detail]

**Fakultas Ekonomi dan Bisnis Islam (FEBI):**
* **Prodi Perbankan Syariah (S1):** Mahasiswa mempelajari prinsip ekonomi Islam, instrumen keuangan syariah, manajemen risiko syariah, dan hukum perbankan syariah. Lulusan memiliki peluang karir di bank syariah, lembaga keuangan mikro syariah, asuransi syariah, konsultasi keuangan, lembaga pemerintah, atau organisasi non-pemerintah.
* **Prodi Manajemen Bisnis Syariah (S1):** Mahasiswa mempelajari prinsip ekonomi Islam, manajemen keuangan syariah, hukum bisnis syariah, dan produk keuangan berbasis syariah. Lulusan dapat bekerja di perusahaan konvensional maupun multinasional yang menerapkan prinsip syariah.

**Fakultas Komputer (FKOM):**
* **Prodi Sistem Informasi (S1):** Keahlian dalam pengembangan perangkat lunak, manajemen basis data, analisis sistem, keamanan informasi, dan teknologi jaringan. Peluang karir luas di perusahaan teknologi, start-up, sebagai ahli keamanan informasi, atau analis sistem.
* **Prodi Komputerisasi Akuntansi (D3):** Keahlian dalam mengelola data, menganalisis informasi keuangan, menggunakan perangkat lunak akuntansi. Prospek karir di perusahaan jasa, manufaktur, perbankan, lembaga keuangan, dan konsultan akuntansi.
* **Prodi Digital Bisnis (S1):** Mempelajari e-commerce, digital marketing, analisis data, teknologi informasi, dan strategi bisnis digital. Lulusan dapat bekerja di perusahaan teknologi, ritel, agensi digital marketing, atau memulai usaha sendiri.

**Fakultas Pertanian (FP):**
* **Prodi Agribisnis (S1):** Keahlian mengelola usaha pertanian/peternakan, analisis pasar, perencanaan produksi, dan strategi pemasaran. Peluang kerja di perusahaan agribisnis, distribusi produk pertanian, lembaga riset, bank, atau menjadi wirausaha.
* **Prodi Teknologi Pangan (S1):** Keahlian dalam proses pembuatan produk pangan yang efisien dan inovatif. Peluang kerja di perusahaan makanan dan minuman, industri farmasi, institusi riset pangan, menjadi konsultan, atau pengusaha.

**Fakultas Keguruan & Ilmu Pendidikan (FKIP):**
* **Prodi Pendidikan Bahasa Inggris (S1):** Peluang karir sebagai pengajar, atau di perusahaan multinasional, penerbitan, media, pariwisata, hingga menjadi diplomat di kementerian luar negeri.
* **Prodi Bimbingan dan Konseling (S1):** Keahlian dalam asesmen psikologis untuk membantu masalah pribadi, profesional, dan akademis. Peluang kerja di institusi pendidikan atau sebagai tim HRD di berbagai perusahaan industri.

**Fakultas Teknik (FT):**
* **Prodi Teknik Industri (S1):** Mempelajari perencanaan produksi, manajemen rantai pasok, perancangan sistem kerja, ergonomi, dan teknik pengambilan keputusan. Peluang kerja di manufaktur, logistik, konsultan manajemen, start-up teknologi, atau menjadi wirausahawan.
* **Prodi Informatika (S1):** Keahlian penguasaan bahasa pemrograman (Java, Python, PHP, dll.), analisis dan perancangan sistem. Peluang kerja di perusahaan teknologi, perbankan, manufaktur, lembaga pemerintahan, atau membangun start-up sendiri.

### [Struktur Website & Sumber Resmi]
* **Tentang Kami:** Mencakup Salam dari Rektor, Sejarah, Visi dan Misi, Profil Dosen, dan Galeri Foto.
* **Fakultas:** Berisi informasi detail tentang FEBI, FKOM, FP, FKIP, dan FT beserta prodi di dalamnya.
* **Informasi:** Berisi link ke Tugas Akhir (Skripsi).
* **LPPM (Lembaga Penelitian dan Pengabdian kepada Masyarakat):** Berisi link ke Jurnal Penelitian, Jurnal Pengabdian, dan Laporan PKM Dosen.
* **SIAKAD:** Link ke sistem informasi akademik di siakad.masoemuniversity.ac.id.
* **Pendaftaran:** Link ke pendaftaran mahasiswa baru di pmb.masoemuniversity.ac.id.
* **Berita:** Daftar berita terkini.
* **Kontak Kami:** Informasi kontak universitas.

### [Informasi Kontak Penting]
* **Website Pendaftaran Mahasiswa Baru (PMB):** https://pmb.masoemuniversity.ac.id
* **Konsultasi Pendaftaran via WhatsApp:** +62 815 6033 022

---

## ATURAN DAN BATASAN PENTING (DIPERKUAT)

1.  **PRINSIP UTAMA: JIKA TIDAK TAHU, KATAKAN TIDAK TAHU.**
    Jika sebuah pertanyaan tidak bisa dijawab secara **EKSPLISIT** dari 'SUMBER PENGETAHUAN UTAMA' di atas, maka jawaban Anda **HARUS** "Mohon maaf, saya tidak memiliki informasi spesifik mengenai hal tersebut." **JANGAN PERNAH** mencoba menyimpulkan, mengasumsikan, menggabungkan informasi, atau membuat karangan dalam bentuk apapun. Jawaban Anda harus 100% berdasarkan teks yang tersedia. Jika informasi yang ditanyakan masih terkait Ma'soem University tapi tidak ada di teks arahkan ke nomor whatsapp +62 815 6033 022 contoh respon "Mohon maaf, saya tidak memiliki informasi spesifik mengenai hal tersebut. Silahkan hubungi kami melalui nomor whatsapp +628156033022"

2.  **Tolak Pertanyaan Di Luar Konteks**: Jika pengguna bertanya tentang topik lain (universitas lain, berita umum, opini pribadi), gunakan frasa: "Mohon maaf, saya adalah Asisten Virtual yang khusus dirancang untuk memberikan informasi mengenai Universitas Ma'soem. Saya tidak memiliki informasi mengenai hal tersebut."

3.  **Pengalihan untuk Informasi Detail & Dinamis**: Untuk pertanyaan spesifik mengenai biaya, persyaratan, dan jadwal, **SELALU** arahkan pengguna ke sumber resmi untuk memastikan mereka mendapatkan informasi yang paling valid dan akurat.

## CONTOH SKENARIO JAWABAN

User: "Berapa biaya SKS untuk prodi Agribisnis?"
Jawaban Anda (BENAR): "Untuk mendapatkan rincian biaya yang paling akurat dan terbaru, termasuk biaya SKS, saya sarankan Anda untuk mengunjungi situs resmi PMB kami di https://pmb.masoemuniversity.com/ atau berkonsultasi langsung dengan tim admisi kami via WhatsApp di nomor +62 815 6033 022. Mereka akan memberikan informasi yang paling valid."

User: "Apakah ada beasiswa untuk anak yatim?"
Jawaban Anda (BENAR, karena tidak ada di teks): "Mohon maaf, saya tidak memiliki informasi spesifik mengenai hal tersebut. Untuk informasi beasiswa yang paling akurat, cara terbaik adalah menghubungi tim admisi kami via WhatsApp di +62 815 6033 022 atau mengunjungi situs pendaftaran resmi di https://pmb.masoemuniversity.ac.id/."
`
};

// ===================================================================================
// II. UTILITAS LOGGING & CACHING
// ===================================================================================

const conversationCache = new Map();

async function log(message, error = null, level = 'INFO') {
    const timestamp = new Date().toLocaleString('en-GB', { hour12: false });
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    if (level === 'ERROR') {
        console.error(logMessage, error || '');
    } else if (level === 'WARN') {
        console.warn(logMessage);
    } else {
        console.log(logMessage);
    }

    if (level === 'ERROR') {
        try {
            const fileContent = `${logMessage}\n${error ? `Detail: ${error.message}\n` : ''}${error?.stack ? `Stack: ${error.stack}\n` : ''}---\n`;
            await fs.appendFile(CONFIG.LOG_FILE, fileContent, 'utf8');
        } catch (writeErr) {
            console.error(`[${timestamp}] [FATAL] Gagal menulis ke file log:`, writeErr);
        }
    }
}

// ===================================================================================
// III. MANAJEMEN PERCAKAPAN
// ===================================================================================

async function loadConversationFromFile(userIdentifier) {
    const userFile = path.join(CONFIG.CONVERSATIONS_DIR, `${userIdentifier}.jsonl`);
    try {
        const data = await fs.readFile(userFile, 'utf8');
        return data.trim().split('\n').map(line => JSON.parse(line));
    } catch (error) {
        if (error.code === 'ENOENT') return null;
        await log(`Gagal memuat percakapan dari file untuk ${userIdentifier}.`, error, 'ERROR');
        return [];
    }
}

async function saveConversationToFile(userIdentifier) {
    if (!conversationCache.has(userIdentifier)) return;
    const conversation = conversationCache.get(userIdentifier);
    const userFile = path.join(CONFIG.CONVERSATIONS_DIR, `${userIdentifier}.jsonl`);
    const data = conversation.map(msg => JSON.stringify(msg)).join('\n') + '\n';
    try {
        await fs.writeFile(userFile, data, 'utf8');
    } catch (error) {
        await log(`Gagal menyimpan percakapan ke file untuk ${userIdentifier}.`, error, 'ERROR');
    }
}

async function getOrCreateConversation(userIdentifier) {
    if (conversationCache.has(userIdentifier)) {
        return conversationCache.get(userIdentifier);
    }
    let conversation = await loadConversationFromFile(userIdentifier);
    if (!conversation || conversation.length === 0) {
        log(`Menginisialisasi percakapan baru untuk ${userIdentifier}`);
        conversation = [{ ...SYSTEM_PROMPT, timestamp: new Date().toISOString() }];
    }
    conversationCache.set(userIdentifier, conversation);
    return conversation;
}

// ===================================================================================
// IV. LOGIKA UTAMA BOT
// ===================================================================================

/**
 * Gets a response from the Gemini API and manages conversation history using system_instruction.
 * @param {string} question - The user's question.
 * @param {string} userIdentifier - The unique user identifier.
 * @returns {Promise<string>} The bot's response.
 */
async function getResponse(question, userIdentifier) {
    const conversation = await getOrCreateConversation(userIdentifier);

    // Tambahkan pesan pengguna baru ke riwayat
    conversation.push({
        role: 'user',
        content: question.trim(),
        timestamp: new Date().toISOString()
    });
    conversationCache.set(userIdentifier, conversation);

    // Ekstrak system prompt dan siapkan riwayat percakapan
    const systemInstruction = {
        role: "system",
        parts: [{ text: SYSTEM_PROMPT.content }]
    };

    // Filter riwayat untuk hanya menyertakan giliran 'user' dan 'assistant'/'model'
    const messagesForGemini = conversation
        .filter(msg => msg.role === 'user' || msg.role === 'assistant') // Hanya ambil user dan assistant
        .slice(-CONFIG.MAX_HISTORY_MESSAGES) // Ambil N pesan terakhir
        .map(({ role, content }) => ({
            role: role === 'assistant' ? 'model' : 'user', // Konversi 'assistant' ke 'model'
            parts: [{ text: content }],
        }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

    try {
        // Buat payload dengan 'contents' dan 'system_instruction' yang terpisah
        const response = await axios.post(url, {
            contents: messagesForGemini,
            system_instruction: systemInstruction, // Gunakan field khusus untuk system prompt
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        // Cek jika ada kandidat respons
        if (response.data.candidates && response.data.candidates.length > 0 && response.data.candidates[0].content.parts) {
            const botResponseContent = response.data.candidates[0].content.parts[0].text;

            // Tambahkan respons bot ke histori
            conversation.push({
                role: 'assistant',
                content: botResponseContent,
                timestamp: new Date().toISOString()
            });
            conversationCache.set(userIdentifier, conversation);

            saveConversationToFile(userIdentifier).catch(err => log("Gagal menyimpan setelah respons.", err, "ERROR"));

            return botResponseContent;
        } else {
            // Tangani jika API tidak memberikan kandidat (misalnya karena filter keamanan)
            log(`Gemini API tidak memberikan respons kandidat untuk ${userIdentifier}. Respons: ${JSON.stringify(response.data)}`, null, 'WARN');
            conversation.pop(); // Hapus pesan pengguna yang gagal
            conversationCache.set(userIdentifier, conversation);
            return 'Mohon maaf, saya tidak dapat memberikan respons saat ini karena konten mungkin tidak sesuai dengan kebijakan. Silakan coba dengan pertanyaan lain.';
        }

    } catch (error) {
        // Log error yang lebih detail dari API jika tersedia
        const errorDetail = error.response?.data?.error ? JSON.stringify(error.response.data.error) : error.message;
        await log(`Gemini API call gagal untuk ${userIdentifier}. Detail: ${errorDetail}`, error, 'ERROR');

        conversation.pop(); // Hapus pesan pengguna yang gagal
        conversationCache.set(userIdentifier, conversation);
        return 'Mohon maaf, terjadi masalah saat memproses permintaan Anda. Tim teknis kami telah diberitahu. Silakan coba lagi nanti.';
    }
}


// ===================================================================================
// V. KLIEN WHATSAPP & EVENT HANDLING
// ===================================================================================
const { Client, LocalAuth } = pkg;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('qr', (qr) => {
    log('QR Code perlu di-scan. Tampilkan di terminal.');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => log('WhatsApp Client siap digunakan!'));
client.on('authenticated', () => log('Autentikasi WhatsApp berhasil.'));
client.on('auth_failure', (msg) => log('Autentikasi WhatsApp GAGAL.', new Error(msg), 'ERROR'));
client.on('disconnected', (reason) => log('Koneksi WhatsApp terputus.', new Error(reason), 'WARN'));

client.on('message', async (message) => {
    if (message.from === 'status@broadcast' || message.isStatus || message.author || !message.body) {
        return;
    }

    const userIdentifier = message.from;
    log(`Pesan diterima dari ${userIdentifier}: "${message.body}"`);

    try {
        const chat = await message.getChat();
        chat.sendStateTyping();
        const responseText = await getResponse(message.body, userIdentifier);
        chat.clearState();
        await message.reply(responseText);
        log(`Balasan dikirim ke ${userIdentifier}.`);
    } catch (error) {
        await log(`Error tidak tertangani saat memproses pesan dari ${userIdentifier}.`, error, 'ERROR');
        try {
            await message.reply('Mohon maaf, terjadi kesalahan tak terduga. Tim kami telah diberitahu dan sedang menanganinya.');
        } catch (fallbackError) {
            await log(`Gagal mengirim pesan error fallback ke ${userIdentifier}.`, fallbackError, 'ERROR');
        }
    }
});


// ===================================================================================
// VI. INISIALISASI
// ===================================================================================
(async () => {
    try {
        await fs.mkdir(CONFIG.CONVERSATIONS_DIR, { recursive: true });
        log(`Direktori percakapan '${CONFIG.CONVERSATIONS_DIR}' telah dipastikan ada.`);
        log('Menginisialisasi WhatsApp client...');
        await client.initialize();
        log('Inisialisasi WhatsApp client berhasil.');
    } catch (error) {
        await log('KRITIS: Gagal total saat inisialisasi.', error, 'ERROR');
        process.exit(1);
    }
})();