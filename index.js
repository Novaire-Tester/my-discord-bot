const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { Client: UnbClient } = require('unb-api');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const unb = new UnbClient(process.env.UNB_TOKEN);
const dataFilePath = path.join(__dirname, 'boosters.json');
let activeBoosters = {};

try {
    if (fs.existsSync(dataFilePath)) {
        const fileData = fs.readFileSync(dataFilePath, 'utf8');
        activeBoosters = JSON.parse(fileData);
        console.log('Successfully loaded saved boosters data!');
    }
} catch (err) {
    console.error('Error loading boosters file, starting fresh:', err);
}

function saveBoostersData() {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(activeBoosters, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving boosters data to file:', err);
    }
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
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
                    if (channel) {
                        channel.send(`💰 **Daily Booster-1 payout!** Added 50,000 cash to <@${userId}> via UnbelievaBoat.`);
                    }
                    data.lastRun = now;
                    dataChanged = true;
                } catch (err) {
                    console.error(`Failed to add UB money daily for ${userId}:`, err);
                }
            }
        }

        if (dataChanged) {
            saveBoostersData();
        }
    }, 3600000); 
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Clean up spaces and force lowercase to handle variations smoothly
    const cleanContent = message.content.replace(/\s+/g, ' ').trim().toLowerCase();

    // 1. Strictly verify the message starts with an allowed prefix/shortcut
    const isCommand = cleanContent.startsWith('!') || cleanContent.startsWith('b-1') || cleanContent.startsWith('b1');
    if (!isCommand) return; // Exit immediately if it's just normal chat text

    // Command 1: !test or !t
    if (cleanContent === '!test' || cleanContent === '!t') {
        return message.reply('Up And Running!! <:emoji_71:1538659767210475611>');
    } 
    
    // Command 2: !help or !h
    else if (cleanContent === '!help' || cleanContent === '!h') {
        return message.reply('Hey! Im MTH Bot, I usually take care of Moderation, Rewards, and More!');
    }

    // Command 3: Booster-1 variations
    else if (
        cleanContent.startsWith('!booster-1') || 
        cleanContent.startsWith('! booster-1') || 
        cleanContent.startsWith('b-1') || 
        cleanContent.startsWith('b1')
    ) {
        // 🔒 PLACE YOUR ALLOWED ROLE ID INSIDE THE QUOTES BELOW:
        const requiredRoleId = "1538016060253413396";

        if (!message.member.roles.cache.has(requiredRoleId)) {
            return message.reply('❌ You do not have permission to use this command!');
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) return message.reply('❌ Please ping a person!');

        if (activeBoosters[targetUser.id]) {
            return message.reply(`⚠️ ${targetUser} is already on the daily Booster-1 list! You cannot add them again.`);
        }

        activeBoosters[targetUser.id] = {
            guildId: message.guild.id,
            channelId: message.channel.id,
            lastRun: Date.now()
        };

        saveBoostersData();

        try {
            await unb.editUserBalance(message.guild.id, targetUser.id, { cash: 50000 });
            message.channel.send(`💰 Successfully added 50,000 cash to ${targetUser}'s UnbelievaBoat balance!`);
            message.reply(`✅ Added ${targetUser} to the daily Booster-1 list and saved their data securely.`);
        } catch (err) {
            console.error(err);
            message.reply('❌ Failed to connect to UnbelievaBoat. Double-check your UNB_TOKEN in Railway variables!');
        }
    }
    
    // 🚨 Fallback: If it starts with ! but matches nothing above
    else if (cleanContent.startsWith('!')) {
        return message.reply('❌ Unknown Command. Type `!help` to see what I can do!');
    }
});

client.login(process.env.DISCORD_TOKEN);
        
