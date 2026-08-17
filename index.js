const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { Client: UnbClient } = require('unb-api');
const fs = require('fs'); // Tool to save data to a file
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

// Load saved data when the bot starts up
try {
    if (fs.existsSync(dataFilePath)) {
        const fileData = fs.readFileSync(dataFilePath, 'utf8');
        activeBoosters = JSON.parse(fileData);
        console.log('Successfully loaded saved boosters data!');
    }
} catch (err) {
    console.error('Error loading boosters file, starting fresh:', err);
}

// Helper function to easily save data anytime it changes
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

    // 24-Hour Automated Loop (Checks every hour)
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

    // Command 1: !test
    if (message.content === '!test') {
        message.reply('Up And Running!! <:emoji_71:1538659767210475611>');
    } 
    
    // Command 2: !help
    else if (message.content === '!help') {
        message.reply('Hey! Im MTH Bot, I usually take care of Moderation, Rewards, and More!');
    }

    // Command 3: !Booster-1 @person
    else if (message.content.startsWith('!Booster-1')) {
        // 🔒 PLACE YOUR ALLOWED ROLE ID INSIDE THE QUOTES BELOW:
        const requiredRoleId = "";

        // Check if the user has the required role
        if (!message.member.roles.cache.has(requiredRoleId)) {
            return message.reply('❌ You do not have permission to use this command!');
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) return message.reply('❌ Please ping a person!');

        // 🛡️ Duplicate protection check
        if (activeBoosters[targetUser.id]) {
            return message.reply(`⚠️ ${targetUser} is already on the daily Booster-1 list! You cannot add them again.`);
        }

        // Save tracking information to memory
        activeBoosters[targetUser.id] = {
            guildId: message.guild.id,
            channelId: message.channel.id,
            lastRun: Date.now()
        };

        // Write the data to your permanent boosters.json file
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
});

client.login(process.env.DISCORD_TOKEN);
        
