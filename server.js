const mineflayer = require('mineflayer');
const { pathfinder } = require('mineflayer-pathfinder');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const ai = require('./ai_engine');
const { handleAction } = require('./actions');
const { testConnection, saveBotSettings, logCommand } = require('./supabase');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let bot = null;
let bname = "";
let hostInfo = {};
let reconnectTimer = null;

function parseColors(text) {
    if (!text) return "";
    let clean = text.replace(/§[l-or]/g, ""); 
    let parts = clean.split('§');
    let html = `<span>${parts[0]}</span>`;
    for (let i = 1; i < parts.length; i++) {
        let code = parts[i].charAt(0);
        let content = parts[i].slice(1);
        html += `<span class="c${code}">${content}</span>`;
    }
    return html;
}

function log(message, type = 'info') {
    console.log(message);
    io.emit('log', parseColors(message));
}

function cleanMessage(msg) {
    if (!msg) return "";
    return msg.replace(/[^\w\sğüşıöçĞÜŞİÖÇ,.?!]/g, '');
}

async function startBot(botname, host, version) {
    bname = botname;
    const [h, p] = host.split(':');
    hostInfo = { host: h, port: parseInt(p) || 25565, username: bname, version: version };

    try {
        await saveBotSettings(botname, host, version, { autoReconnect: true });

        bot = mineflayer.createBot(hostInfo);
        bot.loadPlugin(pathfinder);

        bot.on('login', () => {
            log(`§a✓ Bot giriş yaptı: ${bname}`);
        });

        bot.on('message', (json) => {
            io.emit('log', parseColors(json.toMotd()));
        });

        bot.on('chat', async (username, message) => {
            if (username === bname) return;
            log(`§7[${username}] §f${message}`);

            handleAction(bot, message, username);

            if (message.toLowerCase().includes(bname.toLowerCase())) {
                const response = await ai.askAI(message, username, { 
                    pos: bot.entity?.position,
                    server: host
                });
                if (response) {
                    bot.chat(cleanMessage(response));
                }
            }
        });

        bot.on('playerJoined', (player) => {
            if (player.username !== bname) {
                log(`§a+ ${player.username} katıldı`);
            }
        });

        bot.on('playerLeft', (player) => {
            if (player.username !== bname) {
                log(`§c- ${player.username} ayrıldı`);
            }
        });

        bot.on('end', (reason) => {
            log(`§c❌ Bağlantı koptu: ${reason}`);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(() => {
                log('§e⟳ Yeniden bağlanılıyor...');
                startBot(hostInfo.username, `${hostInfo.host}:${hostInfo.port}`, hostInfo.version);
            }, 5000);
        });

        bot.on('kicked', (reason) => {
            log(`§c👢 Bot atıldı: ${reason}`);
        });

        bot.on('error', (err) => {
            log(`§cHata: ${err.message}`);
        });

        bot.once('spawn', () => {
            log('§a✓ Bot spawn oldu!');
        });

    } catch (error) {
        log(`§cBot başlatılamadı: ${error.message}`);
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/templates/index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/templates/dashboard.html'));
});

app.post('/connect', async (req, res) => {
    const { botname, host, version } = req.body;
    
    if (bot) {
        bot.quit();
        bot = null;
    }
    
    await startBot(botname, host, version);
    res.redirect('/dashboard');
});

app.get('/stop', (req, res) => { 
    if(bot) {
        bot.quit();
        bot = null;
    }
    res.redirect('/'); 
});

// Socket.io
io.on('connection', (socket) => {
    log('§7Web arayüzü bağlandı');
    
    socket.on('web_msg', (message) => {
        if(bot) {
            bot.chat(cleanMessage(message));
            logCommand('web_command', 'web', true);
        }
    });
    
    socket.on('disconnect', () => {
        log('§7Web arayüzü ayrıldı');
    });
});

// Supabase test et ve server'ı başlat
testConnection().then(connected => {
    if (connected) {
        console.log('✅ Supabase bağlantısı hazır');
    } else {
        console.log('⚠️ Supabase bağlantısı yok, hafıza çalışmayabilir');
    }
    
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`
    ╔════════════════════════════════╗
    ║   ZEKI BOT v3.0 (SUPABASE)     ║
    ║    http://0.0.0.0:${PORT}        ║
    ╚════════════════════════════════╝
        `);
    });
});

process.on('SIGTERM', () => {
    if (bot) bot.quit();
    process.exit();
});
