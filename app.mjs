import ollama from 'ollama';
import qrcode from 'qrcode-terminal';
import pkg from 'whatsapp-web.js';
import fs from 'fs/promises'; // Using fs.promises for async file operations
import path from 'path';

const CONVERSATIONS_DIR = 'conversations';
const LOG_FILE = 'error.log';
// Timestamp will be generated live for each console message.

//Example systemMessage
export const systemMessage = { // Objek systemMessage tidak akan memiliki timestamp di sini
    role: "system",
    content: `
Anda adalah AI Assistant profesional yang hanya dapat menjawab pertanyaan dan memberikan bantuan yang relevan dengan peran-peran di dunia Teknologi Informasi (IT) berikut ini:

- Web Developer
- Database Administrator
- Systems Analyst
- Data Scientist
- Network Administrator
- Network Engineer
- Information Security Analyst
- Software Engineer
- Cloud Computing Specialist
- User Experience (UX) Designer
- IT Coordinator
- IT Engineer
- Software Developer
- Support Specialist
- Chief Information Officer (CIO)
- Computer Systems Manager
- Data Analyst
- Data Quality Manager
- IT Analyst
- IT Director
- Computer Network Architect
- Application Developer
- Computer Programmer
- Computer Support Specialist
- System Analyst
- System Designer
- System Implementator
- UI/UX Designer
- Technical Writer
- DevOps Engineer
- Serta semua peran profesional lain yang relevan dalam bidang Teknologi Informasi (IT).

**Batasan dan aturan utama:**
1. Anda *hanya* akan menjawab pertanyaan, permintaan, atau diskusi yang berhubungan langsung dengan topik IT, teknologi digital, sistem informasi, pengembangan perangkat lunak, jaringan komputer, keamanan siber, analisis data, desain pengalaman pengguna, dan bidang-bidang terkait.
2. Anda *tidak akan* menjawab, merespons, atau memberikan opini apa pun tentang topik di luar bidang IT seperti: hiburan, politik, hubungan pribadi, agama, psikologi umum, filsafat, kesehatan, keuangan pribadi, astrologi, dan lain-lain.
3. Jika pengguna mengajukan pertanyaan di luar cakupan peran IT, Anda harus menolak dengan sopan dan memberi tahu bahwa Anda hanya dapat membantu dalam konteks dunia Teknologi Informasi.
4. Anda menjawab dengan pendekatan profesional, berbasis keahlian teknis, dan tidak berperan sebagai teman ngobrol umum, motivator, atau penasihat pribadi.
5. Selalu arahkan kembali ke topik IT jika terjadi penyimpangan.

Contoh penolakan jika ada pertanyaan di luar bidang IT:
> "Maaf, saya hanya dapat membantu dalam topik yang berkaitan dengan bidang Teknologi Informasi (IT). Silakan ajukan pertanyaan terkait IT."

Fokus utama Anda adalah memberikan jawaban akurat, profesional, dan teknis sesuai standar industri IT global.
`
};

// --- Logging Utility ---
/**
 * Mencatat pesan error dengan timestamp ke file log.
 * Juga mengirimkan notifikasi ke console.error, console.warn, dan console.log.
 * @param {string} message Pesan error yang akan dicatat.
 * @param {Error} [error] Objek error, jika ada.
 * @param {string} [context] Konteks tambahan tentang di mana error terjadi.
 */
async function logError(message, error = null, context = '') {
    const liveTimestamp = new Date().toLocaleString('en-GB', { hour12: false }); // Timestamp for console messages
    const fileLogTimestamp = liveTimestamp; // Using the same timestamp for file log for consistency

    let logEntry = `[${fileLogTimestamp}]`;
    if (context) {
        logEntry += ` [CONTEXT: ${context}]`;
    }
    logEntry += ` ERROR: ${message}\n`;

    if (error) {
        logEntry += `Detail: ${error.message || 'Tidak ada detail error tambahan.'}\n`;
        if (error.stack) {
            logEntry += `Stack: ${error.stack}\n`;
        }
    }
    logEntry += '---\n';

    try {
        await fs.appendFile(LOG_FILE, logEntry, 'utf8');
        const consoleContextStr = context ? ` (context: ${context})` : '';
        const baseMessage = `Logged error${consoleContextStr}: ${message}`;

        console.error(`[${liveTimestamp}] ${baseMessage}`);
        console.warn(`[${liveTimestamp}] WARNING: ${baseMessage}`);
        // Added console.log as per your request
        console.log(`[${liveTimestamp}] INFO (Error Logged to File): ${baseMessage}${error ? ` - Error Detail: ${error.message || 'N/A'}` : ''}`);

    } catch (err) { // This catch is for fs.appendFile failure
        const fsFailMsg = `GAGAL MENULIS KE LOG FILE: ${err.message}`;
        console.error(`[${liveTimestamp}] ${fsFailMsg}`);
        console.warn(`[${liveTimestamp}] WARNING: ${fsFailMsg}`);
        // Added console.log for this specific failure
        console.log(`[${liveTimestamp}] INFO (Log File Write Failure): ${fsFailMsg}`);

        // Still attempt to log the original error to console
        const originalErrorContextStr = context ? ` (context: ${context})` : '';
        const originalErrorBaseMsg = `Error Asli (yang gagal ditulis ke file)${originalErrorContextStr}: ${message}`;
        console.error(`[${liveTimestamp}] ${originalErrorBaseMsg}`, error); // The 'error' object is passed to console.error here

        let warnDetails = '';
        if (error) {
            warnDetails = ` - Detail: ${error.message || (typeof error === 'string' ? error : 'Error object details logged with console.error')}`;
        }
        console.warn(`[${liveTimestamp}] WARNING: ${originalErrorBaseMsg}${warnDetails}`);
        // Added console.log for the original error that failed to be written to file
        console.log(`[${liveTimestamp}] INFO (Original Error - Not Written to File): ${originalErrorBaseMsg}${error ? ` - Error Detail: ${error.message || (typeof error === 'string' ? error : 'See console.error for full object')}` : ''}`);
    }
}
// --- End Logging Utility ---
// --- End Logging Utility ---

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// --- Conversation Management ---

/**
 * Menyimpan percakapan pengguna tertentu ke file JSONL mereka.
 * Setiap pesan ditulis sebagai baris JSON terpisah.
 * @param {string} userIdentifier - Identifier unik pengguna.
 * @param {Array<Object>} conversationArray - Array percakapan pengguna.
 * @returns {Promise<void>}
 */
async function saveUserConversation(userIdentifier, conversationArray) {
    const userConversationDir = path.join(CONVERSATIONS_DIR, userIdentifier);
    const userConversationFile = path.join(userConversationDir, 'conversation.jsonl');
    const context = `saveUserConversation(${userIdentifier})`;

    try {
        await fs.mkdir(userConversationDir, { recursive: true });
        let fileHandle;
        try {
            fileHandle = await fs.open(userConversationFile, 'w');
            for (const message of conversationArray) {
                if (message) {
                    await fileHandle.write(JSON.stringify(message) + '\n');
                }
            }

            console.log(`[${new Date().toLocaleString('en-GB', { hour12: false })}] Percakapan untuk ${userIdentifier} berhasil disimpan di ${userConversationFile}`);
        } finally {
            if (fileHandle) {
                await fileHandle.close();
            }
        }
    } catch (error) {
        await logError(`Gagal menyimpan percakapan`, error, context);
    }
}

/**
 * Memuat atau membuat percakapan untuk pengguna dari file JSONL.
 * Metode ini memastikan direktori pengguna ada, membaca file jika ada,
 * dan memvalidasi/memperbaiki system message termasuk timestamp-nya.
 * @param {string} userIdentifier - Identifier unik pengguna.
 * @returns {Promise<Array<Object>>} Array percakapan pengguna.
 */
async function getOrCreateConversation(userIdentifier) {
    const userConversationDir = path.join(CONVERSATIONS_DIR, userIdentifier);
    const userConversationFile = path.join(userConversationDir, 'conversation.jsonl');
    const context = `getOrCreateConversation(${userIdentifier})`;
    let conversationMessages = [];
    let loadedFromFile = false;
    const systemMessageWithTimestamp = {
        ...systemMessage,
        timestamp: new Date().toISOString()
    };

    try {
        try {
            await fs.mkdir(userConversationDir, { recursive: true });
        } catch (mkdirError) {
            await logError(`Gagal membuat direktori pengguna.`, mkdirError, context);
            return [systemMessageWithTimestamp];
        }

        try {
            const data = await fs.readFile(userConversationFile, 'utf8');
            const lines = data.trim().split('\n');

            for (const line of lines) {
                if (line.trim() === '') continue;

                try {
                    const message = JSON.parse(line);
                    conversationMessages.push(message);
                } catch (parseError) {
                    console.warn(`[${new Date().toLocaleString('en-GB', { hour12: false })}] [${context}] Gagal mem-parse baris JSONL: "${line.substring(0, 100)}...". Melewati. Error: ${parseError.message}`);
                }
            }
            loadedFromFile = true;
            console.log(`[${new Date().toLocaleString('en-GB', { hour12: false })}] Percakapan untuk ${userIdentifier} berhasil dimuat dari ${userConversationFile}`);
        } catch (readFileError) {
            if (readFileError.code === 'ENOENT') {
                console.log(`[${new Date().toLocaleString('en-GB', { hour12: false })}] [${context}] File percakapan tidak ditemukan. Menginisialisasi baru.`);
            } else {
                await logError(`Gagal memuat atau mem-parse file percakapan JSONL.`, readFileError, context);
            }
        }
    } catch (unexpectedError) {
        await logError(`Error tak terduga di awal getOrCreateConversation.`, unexpectedError, context);
        return [systemMessageWithTimestamp];
    }

    let needsSystemMessageCorrection = false;
    if (conversationMessages.length === 0) {
        needsSystemMessageCorrection = true;
        if (!loadedFromFile) {
            console.log(`[${new Date().toLocaleString('en-GB', { hour12: false })}] [${context}] Menginisialisasi percakapan baru dengan system message.`);
        }
    } else {
        const firstMsg = conversationMessages[0];
        if (!(firstMsg.role === 'system' &&
            firstMsg.content === systemMessage.content &&
            typeof firstMsg.timestamp === 'string' && firstMsg.timestamp.length > 0
        )) {
            needsSystemMessageCorrection = true;
            console.warn(`[${new Date().toLocaleString('en-GB', { hour12: false })}] [${context}] System message memerlukan koreksi/penambahan timestamp.`);
        }
    }

    if (needsSystemMessageCorrection) {
        const filteredUserAndAssistantMessages = conversationMessages.filter(msg => msg.role !== 'system');
        conversationMessages = [systemMessageWithTimestamp, ...filteredUserAndAssistantMessages];
        if (loadedFromFile) {
            console.log(`[${new Date().toLocaleString('en-GB', { hour12: false })}] [${context}] System message diperbaiki/ditambahkan timestampnya.`);
        }
    }

    return conversationMessages;
}

/**
 * Mendapatkan respons dari model AI dan mengelola histori percakapan.
 * @param {string} question - Pertanyaan dari pengguna.
 * @param {string} userIdentifier - Identifier unik pengguna.
 * @returns {Promise<string>} Respons dari bot.
 */
async function getResponse(question, userIdentifier) {
    const context = `getResponse(${userIdentifier})`;
    let conversation;
    try {
        conversation = await getOrCreateConversation(userIdentifier);
    } catch (error) {
        await logError('Error tak terduga dari getOrCreateConversation.', error, context);
        return 'Mohon maaf, terjadi masalah internal saat menyiapkan percakapan Anda. Silakan coba lagi.';
    }

    conversation.push({
        role: 'user',
        content: question.toLowerCase(),
        timestamp: new Date().toISOString()
    });

    let botResponseContent = '';
    let ollamaSuccess = false;
    const MAX_MESSAGES = 10;
    const recentMessages = conversation.slice(-MAX_MESSAGES);
    const hasSystemMessage = recentMessages.some(msg => msg.role === 'system' && msg.content === systemMessage.content);
    if (!hasSystemMessage) {
        recentMessages.unshift(systemMessage); // Note: systemMessage doesn't have live timestamp here, but getOrCreateConversation ensures the stored one does.
        // For Ollama, the raw systemMessage content is key.
    }

    try {
        const response = await ollama.chat({
            model: 'gemma3:4b',
            messages: recentMessages,
        });
        botResponseContent = response.message.content;
        ollamaSuccess = true;
    } catch (error) {
        await logError(`Ollama chat gagal.`, error, context + ` - Question: "${question}"`);
        botResponseContent = 'Mohon maaf, terjadi masalah saat memproses permintaan Anda. Silakan coba lagi nanti.';
        conversation.pop();
    }

    if (ollamaSuccess) {
        conversation.push({
            role: 'assistant',
            content: botResponseContent,
            timestamp: new Date().toISOString()
        });
    }
    try {
        await saveUserConversation(userIdentifier, conversation);
    } catch (error) { // This catch is for saveUserConversation error, logError inside it will also console.warn
        const timestamp = new Date().toLocaleString('en-GB', { hour12: false });
        const errMsg = `[${context}] Peringatan: Gagal menyimpan percakapan setelah respons Ollama. Detail sudah di-log oleh saveUserConversation.`;
        console.error(`[${timestamp}] ${errMsg}`);
        console.warn(`[${timestamp}] WARNING: ${errMsg}`);
    }

    return botResponseContent;
}

// --- WhatsApp Client Setup ---
const { Client, LocalAuth } = pkg;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        // headless: true, // Aktifkan untuk server
        // args: ['--no-sandbox', '--disable-setuid-sandbox'], // Mungkin diperlukan di Linux
    }
});

client.on('qr', (qr) => {
    try {
        qrcode.generate(qr, { small: true });
    } catch (e) {
        const timestamp = new Date().toLocaleString('en-GB', { hour12: false });
        const errMsg = `Gagal generate QR Code:`;
        console.error(`[${timestamp}] ${errMsg}`, e);
        console.warn(`[${timestamp}] WARNING: ${errMsg}${e ? ` - Detail: ${e.message || e}` : ''}`);
        logError("Gagal generate QR Code di terminal", e, "client.on('qr')");
    }
});

client.on('authenticated', () => {
    console.log(`[${new Date().toLocaleString('en-GB', { hour12: false })}] AUTHENTICATED`);
});

client.on('auth_failure', async (msg) => {
    const timestamp = new Date().toLocaleString('en-GB', { hour12: false });
    const errMsg = `AUTHENTICATION FAILURE`;
    console.error(`[${timestamp}] ${errMsg}`, msg);
    console.warn(`[${timestamp}] WARNING: ${errMsg}${msg ? ` - Detail: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}` : ''}`);
    await logError('WhatsApp authentication failure.', new Error(String(msg)), 'client.on("auth_failure")');
});

client.on('ready', async () => {
    console.log(`[${new Date().toLocaleString('en-GB', { hour12: false })}] Client is ready!`);
    try {
        await fs.mkdir(CONVERSATIONS_DIR, { recursive: true });
        console.log(`[${new Date().toLocaleString('en-GB', { hour12: false })}] Direktori dasar percakapan '${CONVERSATIONS_DIR}' telah dipastikan ada.`);
    } catch (error) {
        await logError(`Gagal membuat direktori dasar percakapan '${CONVERSATIONS_DIR}'. Bot mungkin tidak berfungsi dengan benar.`, error, 'client.on("ready")');
    }
});

client.on('message', async (message) => {
    const messageEventTimestamp = message.t ? new Date(message.t * 1000) : new Date();
    const formattedMessageEventTimestamp = messageEventTimestamp.toLocaleString('en-GB', { hour12: false }); // Timestamp of the WA message event

    const messageContext = `client.on('message', from: ${message.from}, timestamp: ${formattedMessageEventTimestamp}, body: "${message.body ? message.body.substring(0, 50) + '...' : 'N/A'}")`;

    try {
        if (message.body) {
            const userIdentifier = message.from;
            let chat;

            try {
                chat = await message.getChat();
            } catch (getChatError) {
                await logError('Gagal mendapatkan objek chat.', getChatError, messageContext);
                return;
            }

            try {
                await chat.sendStateTyping();
                console.log(`[${new Date().toLocaleString('en-GB', { hour12: false })}] [${formattedMessageEventTimestamp}] Typing state sent for ${userIdentifier}`);
            } catch (typingError) {
                await logError('Gagal sendStateTyping.', typingError, messageContext);
            }

            const responseText = await getResponse(message.body, userIdentifier);
            console.log(`[${new Date().toLocaleString('en-GB', { hour12: false })}] Response received from AI for ${userIdentifier}`);

            try {
                await chat.clearState();
                const stateClearedAt = new Date().toLocaleString('en-GB', { hour12: false }); // Specific moment state was cleared
                console.log(`[${new Date().toLocaleString('en-GB', { hour12: false })}] [${stateClearedAt}] Typing state cleared for ${userIdentifier}`);
            } catch (clearStateError) {
                await logError('Gagal clearState.', clearStateError, messageContext);
            }

            try {
                await message.reply(responseText);
                // The outermost timestamp is still the actual "live" log time.
                console.log(`[${new Date().toLocaleString('en-GB', { hour12: false })}] Reply sent for ${userIdentifier}`);
            } catch (replyError) {
                await logError('Gagal mengirim balasan.', replyError, messageContext);
            }
        }
    } catch (error) {
        await logError('Error tidak tertangani di event "message".', error, messageContext);
        if (message && typeof message.reply === 'function' && !message.hasReplied) {
            try {
                await message.reply('Mohon maaf, terjadi kesalahan tak terduga. Tim kami telah diberitahu.');
            } catch (fallbackReplyError) {
                await logError('Gagal mengirim balasan error fallback.', fallbackReplyError, messageContext);
            }
        }
    }
});

client.on('message_create', (message) => {
    if (message.fromMe) return;

    try {
        const waMessageTimestamp = new Date(message.timestamp * 1000);
        const formattedWaMessageTime = waMessageTimestamp.toLocaleString('en-GB', { hour12: false }); // Timestamp of actual WA message creation
        console.log(`[${new Date().toLocaleString('en-GB', { hour12: false })}] [${formattedWaMessageTime}] PESAN DARI ${message.from} ke ${message.to}: ${message.body}`);
    } catch (e) {
        const timestamp = new Date().toLocaleString('en-GB', { hour12: false });
        const errMsg = `Error saat logging message_create:`;
        console.error(`[${timestamp}] ${errMsg}`, e);
        console.warn(`[${timestamp}] WARNING: ${errMsg}${e ? ` - Detail: ${e.message || e}` : ''}`);
    }
});

client.on('disconnected', async (reason) => {
    console.log(`[${new Date().toLocaleString('en-GB', { hour12: false })}] Client was logged out`, reason);
    await logError('WhatsApp client disconnected.', new Error(String(reason)), 'client.on("disconnected")');
});

// --- Initialize Client ---
(async () => {
    try {
        console.log(`[${new Date().toLocaleString('en-GB', { hour12: false })}] Menginisialisasi WhatsApp client...`);
        await client.initialize();
        console.log(`[${new Date().toLocaleString('en-GB', { hour12: false })}] WhatsApp client berhasil diinisialisasi.`);
    } catch (error) {
        await logError('Kritis: Gagal menginisialisasi WhatsApp client.', error, 'initialization');
        process.exit(1);
    }
})();