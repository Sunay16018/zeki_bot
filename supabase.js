const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing! Check .env file');
    process.exit(1);
}

console.log('🔌 Supabase bağlanıyor...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        const { error } = await supabase.from('chat_messages').select('count').limit(1);
        if (error && error.code === '42P01') {
            console.log('✅ Supabase bağlantı başarılı (tablolar oluşturulacak)');
            return true;
        } else if (error) {
            console.error('❌ Supabase bağlantı hatası:', error.message);
            return false;
        } else {
            console.log('✅ Supabase bağlantı başarılı');
            return true;
        }
    } catch (error) {
        console.error('❌ Supabase bağlantı hatası:', error.message);
        return false;
    }
}

async function saveChatMessage(sender, message, response, server) {
    try {
        const { error } = await supabase
            .from('chat_messages')
            .insert([{ sender, message, response, server, created_at: new Date() }]);
        if (error) throw error;
    } catch (error) {
        console.error('Error saving chat message:', error.message);
    }
}

async function getRecentMessages(limit = 50) {
    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data.reverse();
    } catch (error) {
        console.error('Error getting recent messages:', error.message);
        return [];
    }
}

async function saveBotSettings(botName, server, version, settings = {}) {
    try {
        const { error } = await supabase
            .from('bot_settings')
            .upsert([{ bot_name: botName, server, version, settings, last_connected: new Date() }], 
                    { onConflict: 'bot_name' });
        if (error) throw error;
    } catch (error) {
        console.error('Error saving bot settings:', error.message);
    }
}

async function logCommand(command, sender, success = true) {
    try {
        const { error } = await supabase
            .from('command_logs')
            .insert([{ command, sender, success, created_at: new Date() }]);
        if (error) throw error;
    } catch (error) {
        console.error('Error logging command:', error.message);
    }
}

module.exports = {
    supabase,
    testConnection,
    saveChatMessage,
    getRecentMessages,
    saveBotSettings,
    logCommand
};
