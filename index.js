const { Client, GatewayIntentBits, ActivityType, Partials } = require('discord.js');
const { Client: UnbClient } = require('unb-api');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.GuildMember, Partials.User]
});

const unb = new UnbClient(process.env.UNB_TOKEN);
const dataFilePath = path.join(__dirname, 'boosters.json');
let activeBoosters = {};

try {
    if (fs.existsSync(dataFilePath)) {
        activeBoosters = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    }
} catch (err) { console.error('Fresh file initialized.', err); }

function saveBoostersData() {
    fs.writeFileSync(dataFilePath, JSON.stringify(activeBoosters, null, 2), 'utf8');
}

client.once('ready', () => {
    console.log(`MTH Bot is Online as ${client.user.tag}`);
    client.user.setActivity('!test', { type: ActivityType.Listening });

    setInterval(async () => {
        const now = Date.now();
        let dataChanged = false;
        for (const userId in activeBoosters) {
            const data = activeBoosters[userId];
            if (now - data.lastRun >= 86400000) {
                try {
                    await unb.editUserBalance(data.guildId, userId, { cash: 50000 });
                    const channel = client.channels.cache.get(data.channelId);
                    if (channel) channel.send(`💰 **Daily Booster-1 payout!** Added 50,000 cash to <@${userId}>.`);
                    data.lastRun = now;
                    dataChanged = true;
                } catch (e) { console.error(e); }
            }
        }
        if (dataChanged) saveBoostersData();
    }, 3600000); 
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    try {
        if (oldMember.partial) await oldMember.fetch().catch(() => null);
        if (newMember.partial) await newMember.fetch().catch(() => null);

        const hadRole = oldMember.roles?.cache.has(config.REQUIRED_ROLE_ID) || false;
        const hasRole = newMember.roles?.cache.has(config.REQUIRED_ROLE_ID) || false;
        const boosterChannel = newMember.guild.channels.cache.get(config.BOOSTER_CHAT_CHANNEL_ID);

        if (!hadRole && hasRole && !activeBoosters[newMember.id]) {
            activeBoosters[newMember.id] = { guildId: newMember.guild.id, channelId: config.BOOSTER_CHAT_CHANNEL_ID, lastRun: Date.now() };
            saveBoostersData();
            if (boosterChannel) boosterChannel.send(`Hey <@${newMember.id}>! Thank you for boosting. Here, have some UB!`);
            await unb.editUserBalance(newMember.guild.id, newMember.id, { cash: 50000 }).catch(console.error);
        }
        if (hadRole && !hasRole && activeBoosters[newMember.id]) {
            delete activeBoosters[newMember.id];
            saveBoostersData();
            if (boosterChannel) boosterChannel.send(`👋 Goodbye <@${newMember.id}>, your server boost has ended.`);
        }
    } catch (e) { console.error(e); }
});

let activeMessageCount = 0, lastDropTime = 0, currentActiveDrop = null;

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const clean = message.content.replace(/\s+/g, ' ').trim().toLowerCase();

    if (currentActiveDrop && clean === 'claim') {
        const prize = currentActiveDrop.amount;
        currentActiveDrop = null;
        try {
            await unb.editUserBalance(message.guild.id, message.author.id, { cash: prize });
            return message.reply(`🎉 **WINNER!** <@${message.author.id}> caught the pouch and won **250,000** cash!`);
        } catch (e) { return message.reply('❌ API failure.'); }
    }

    const now = Date.now();
    if (!currentActiveDrop && (now - lastDropTime >= config.DROP_COOLDOWN_MS)) {
        activeMessageCount++;
        if (activeMessageCount >= config.MESSAGES_NEEDED_FOR_DROP) {
            activeMessageCount = 0; lastDropTime = now; currentActiveDrop = { amount: 250000 };
            return message.channel.send('🎁💰 **ACTIVITY DROP EVENT!** 💰🎁\nType **`CLAIM`** right now to snatch it!');
        }
    }

    const isCommand = clean.startsWith('!') || clean.startsWith('b-') || clean.startsWith('b1') || clean.startsWith('drop');
    if (!isCommand) return; 

    if (clean === '!test' || clean === '!t') return message.reply('Up And Running!! <:emoji_71:1538659767210475611>');
    if (clean === '!help' || clean === '!h') return message.reply('Hey! Im MTH Bot, I usually take care of Moderation, Rewards, and More!');

    if (clean === '!list' || clean === '!l') {
        const userIds = Object.keys(activeBoosters);
        if (userIds.length === 0) return message.reply('📝 Active list is empty.');
        return message.reply(`📝 **Current Booster-1 List:**\n${userIds.map((id, i) => `${i + 1}. <@${id}>`).join('\n')}`);
    }

    if (clean === '!drop' || clean === '!d' || clean === 'drop' || clean === 'd') {
        if (!message.member.roles.cache.has(config.REQUIRED_ROLE_ID)) return message.reply('❌ Access denied.');
        if (currentActiveDrop) return message.reply('⚠️ Active drop ongoing.');
        currentActiveDrop = { amount: 250000 };
        return message.channel.send('🎁💰 **MANUAL SOMEONE DROP EVENT!** 💰🎁\nType **`CLAIM`** right now to snatch it!');
    }

    if (clean === '!booster-test' || clean === '!b-test' || clean === 'b-test' || clean === 'b1-test') {
        try {
            if (message.member.roles.cache.has(config.REQUIRED_ROLE_ID)) {
                await message.member.roles.remove(config.REQUIRED_ROLE_ID);
                return message.reply('🧪 **Simulation:** Removed role.');
            } else {
                await message.member.roles.add(config.REQUIRED_ROLE_ID);
                return message.reply('🧪 **Simulation:** Granted role.');
            }
        } catch (e) { return message.reply('❌ Move the MTH Bot role higher in server settings.'); }
    }

    if (clean.startsWith('!booster-1') || clean.startsWith('!b-1')) {
        if (!message.member.roles.cache.has(config.REQUIRED_ROLE_ID)) return message.reply('❌ Access denied.');
        const targetUser = message.mentions.users.first();
        if (!targetUser) return message.reply('❌ Ping someone.');
        if (activeBoosters[targetUser.id]) return message.reply('⚠️ Already on list.');

        activeBoosters[targetUser.id] = { guildId: message.guild.id, channelId: message.channel.id, lastRun: Date.now() };
        saveBoostersData();
        await unb.editUserBalance(message.guild.id, targetUser.id, { cash: 50000 }).catch(() => null);
        return message.reply(`✅ Forced manual save for ${targetUser}.`);
    }
    
    if (clean.startsWith('!')) return message.reply('❌ Unknown Command. Type `!help`.');
});

process.on('unhandledRejection', error => console.error(error));
client.login(process.env.DISCORD_TOKEN);
        
