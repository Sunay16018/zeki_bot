const { goals } = require('mineflayer-pathfinder');
const { logCommand } = require('./supabase');

function handleAction(bot, reply, sender) {
    const target = bot.players[sender]?.entity;
    const msg = reply.toLowerCase();

    // HAREKET KOMUTLARI
    if (msg.includes("gel") || msg.includes("takip et")) {
        if (target) {
            bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true);
            bot.chat("Geliyorum kanka! 🚶");
            logCommand('follow', sender, true);
        }
        return;
    }

    if (msg.includes("dur") || msg.includes("bekle")) {
        bot.pathfinder.setGoal(null);
        bot.clearControlStates();
        bot.chat("Duruyorum kanka! ✋");
        logCommand('stop', sender, true);
        return;
    }

    if (msg.includes("bana gel") || msg.includes("gel buraya")) {
        if (target) {
            bot.pathfinder.setGoal(new goals.GoalNear(target.position.x, target.position.y, target.position.z, 2));
            bot.chat("Geliyorum yanına! 🚶");
            logCommand('come', sender, true);
        }
        return;
    }

    if (msg.includes("zıpla") || msg.includes("hop")) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 500);
        bot.chat("Hop! 🦘");
        logCommand('jump', sender, true);
        return;
    }

    if (msg.includes("otur") || msg.includes("eğil") || msg.includes("çömel")) {
        bot.setControlState('sneak', true);
        bot.chat("Oturdum kanka 😌");
        logCommand('sneak', sender, true);
        return;
    }

    if (msg.includes("kalk") || msg.includes("ayağa kalk")) {
        bot.setControlState('sneak', false);
        bot.chat("Kalktım! 🧍");
        logCommand('stand', sender, true);
        return;
    }

    if (msg.includes("koş") || msg.includes("hızlı git")) {
        bot.setControlState('sprint', true);
        setTimeout(() => bot.setControlState('sprint', false), 3000);
        bot.chat("Koşuyorum! 🏃💨");
        logCommand('sprint', sender, true);
        return;
    }

    // BAKIŞ KOMUTLARI
    if (msg.includes("bana bak") || msg.includes("yüzüme bak")) {
        if (target) {
            bot.lookAt(target.position.offset(0, 1.6, 0));
            bot.chat("Sana bakıyorum kanka 👀");
            logCommand('look', sender, true);
        }
        return;
    }

    if (msg.includes("sağa bak") || msg.includes("sağa dön")) {
        bot.look(bot.entity.yaw + Math.PI/2, 0);
        bot.chat("Sağa baktım 👉");
        logCommand('look_right', sender, true);
        return;
    }

    if (msg.includes("sola bak") || msg.includes("sola dön")) {
        bot.look(bot.entity.yaw - Math.PI/2, 0);
        bot.chat("Sola baktım 👈");
        logCommand('look_left', sender, true);
        return;
    }

    if (msg.includes("arkana bak") || msg.includes("arkaya bak")) {
        bot.look(bot.entity.yaw + Math.PI, 0);
        bot.chat("Arkama baktım 🔄");
        logCommand('look_back', sender, true);
        return;
    }

    // ENVANTER KOMUTLARI
    if (msg.includes("envanter") || msg.includes("çantam") || msg.includes("eşyalar")) {
        const items = bot.inventory.slots.filter(slot => slot);
        if (items.length === 0) {
            bot.chat("Envanterim boş kanka 😕");
        } else {
            bot.chat(`Envanterimde ${items.length} eşya var:`);
            items.slice(0, 5).forEach(item => {
                bot.chat(`- ${item.name} x${item.count}`);
            });
        }
        logCommand('inventory', sender, true);
        return;
    }

    if (msg.includes("elinde ne var") || msg.includes("ne tutuyorsun")) {
        const item = bot.heldItem;
        if (item) {
            bot.chat(`Elimde ${item.name} x${item.count} var ✋`);
        } else {
            bot.chat("Elimde bir şey yok boş 👐");
        }
        logCommand('held_item', sender, true);
        return;
    }

    // KONUM KOMUTU
    if (msg.includes("neredesin") || msg.includes("konumun ne")) {
        const pos = bot.entity.position;
        bot.chat(`Konumum: x=${Math.floor(pos.x)}, y=${Math.floor(pos.y)}, z=${Math.floor(pos.z)} 📍`);
        logCommand('position', sender, true);
        return;
    }
}

module.exports = { handleAction };
