const axios = require('axios');
const { getRecentMessages, saveChatMessage } = require('./supabase');
require('dotenv').config();

const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "google/gemini-2.0-flash-lite-001";

async function askAI(message, sender, botInfo) {
    try {
        const recentMessages = await getRecentMessages(20);
        
        let memory = "";
        recentMessages.forEach(msg => {
            memory += `${msg.sender}: ${msg.message}\nZeki: ${msg.response}\n`;
        });

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: MODEL,
            messages: [
                { 
                    role: "system", 
                    content: `Sen Minecraft botu Zeki'sin. Çok KISA cevap ver. Sadece düz metin kullan. Sadece Türkçe konuş.
                    Konumun: x=${botInfo.pos?.x || 0}, y=${botInfo.pos?.y || 0}, z=${botInfo.pos?.z || 0}
                    
                    Son konuşmalar:
                    ${memory}`
                },
                { role: "user", content: `${sender}: ${message}` }
            ],
            max_tokens: 60
        }, { 
            headers: { 
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/Sunay16018/zeki-bot",
                "X-Title": "Zeki Minecraft Bot"
            } 
        });

        let reply = response.data.choices[0].message.content;
        reply = reply.replace(/[^\w\sğüşıöçĞÜŞİÖÇ,.?!]/g, '');
        
        await saveChatMessage(sender, message, reply, botInfo.server || 'unknown');
        
        return reply;
    } catch (e) { 
        console.log("AI Hatasi:", e.message);
        return "Kanka kafam karisti, tekrar soyler misin?"; 
    }
}

module.exports = { askAI };
