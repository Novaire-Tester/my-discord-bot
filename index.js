const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { Client: UnbClient } = require('unb-api');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Required to detect role changes and manage them
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const unb = new UnbClient(process.env.UNB_TOKEN);
const dataFilePath = path.join(__dirname, 'boosters.json');
let activeBoosters = {};

// ⚙️ SYSTEM CONFIGURATION
const REQUIRED_ROLE_ID = "1538016060253413396"; 
const BOOSTER_CHAT_CHANNEL_ID = "1538986835210936380"; 

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

    // 24-Hour Automated Loop
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

// 🤖 AUTOMATIC BOOSTER DETECTOR (Welcome & Goodbye Tracker)
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const hadRole = oldMember.roles.cache.has(REQUIRED_ROLE_ID);
    const hasRole = newMember.roles.cache.has(REQUIRED_ROLE_ID);
    const boosterChannel = newMember.guild.channels.cache.get(BOOSTER_CHAT_CHANNEL_ID);

    // Case 1: Someone JUST got the booster role
    if (!hadRole && hasRole) {
        if (activeBoosters[newMember.id]) return;

        activeBoosters[newMember.id] = {
            guildId: newMember.guild.id,
            channelId: BOOSTER_CHAT_CHANNEL_ID,
            lastRun: Date.now()
        };
        saveBoostersData();

        if (boosterChannel) {
            boosterChannel.send(`Hey <@${newMember.id}>! Thank you for boosting. Here, have some UB!`);
        }

        try {
            await unb.editUserBalance(newMember.guild.id, newMember.id, { cash: 50000 });
        } catch (err) {
            console.error(`Failed automatic initial UB payout for ${newMember.id}:`, err);
        }
    }

    // Case 2: Someone's boost RAN OUT (Role removed)
    if (hadRole && !hasRole) {
        if (activeBoosters[newMember.id]) {
            delete activeBoosters[newMember.id];
            saveBoostersData();

            if (boosterChannel) {
                boosterChannel.send(`👋 Goodbye <@${newMember.id}>, your server boost has ended. Your daily UB benefits have been removed.`);
            }
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const cleanContent = message.content.replace(/\s+/g, ' ').trim().toLowerCase();
    
    // Adjusted check to allow b-test and b1-test commands to pass through
    const isCommand = cleanContent.startsWith('!') || cleanContent.startsWith('b-') || cleanContent.startsWith('b1');
    if (!isCommand) return; 

    // Command 1: !test
    if (cleanContent === '!test' || cleanContent === '!t') {
        return message.reply('Up And Running!! <:emoji_71:1538659767210475611>');
    } 
    
    // Command 2: !help
    else if (cleanContent === '!help' || cleanContent === '!h') {
        return message.reply('Hey! Im MTH Bot, I usually take care of Moderation, Rewards, and More!');
    }

    // Command 3: !list
    else if (cleanContent === '!list' || cleanContent === '!l') {
        const userIds = Object.keys(activeBoosters);
        if (userIds.length === 0) {
            return message.reply('📝 There are currently **no users** on the active Booster-1 list.');
        }
        const listText = userIds.map((id, index) => `${index + 1}. <@${id}>`).join('\n');
        return message.reply(`📝 **Current Booster-1 List:**\n${listText}`);
    }

    // Command 4: !booster-test Simulator (NEW COMMAND)
    // Shortcuts: !booster-test, ! booster-test, !b-test, ! b-test, b-test, b1-test
    else if (
        cleanContent === '!booster-test' ||
        cleanContent === '! booster-test' ||
        cleanContent === '!b-test' ||
        cleanContent === '! b-test' ||
        cleanContent === 'b-test' ||
        cleanContent === 'b1-test'
    ) {
        const hasRole = message.member.roles.cache.has(REQUIRED_ROLE_ID);
        
        try {
            if (hasRole) {
                // If you already have it, remove it to simulate an expired boost
                await message.member.roles.remove(REQUIRED_ROLE_ID);
                return message.reply('🧪 **Simulation:** Removed your booster role to test the expired boost sequence!');
            } else {
                // If you don't have it, give it to simulate a brand new boost
                await message.member.roles.add(REQUIRED_ROLE_ID);
                return message.reply('🧪 **Simulation:** Granted you the booster role to test the new boost sequence!');
            }
        } catch (err) {
            console.error(err);
            return message.reply('❌ Unable to change your roles. Please check that the MTH Bot role is moved **ABOVE** the booster role in your server settings hierarchy, otherwise Discord blocks the bot from granting it!');
        }
    }

    // Command 5: Manual Fallback Option
    else if (
        cleanContent.startsWith('!booster-1') || 
        cleanContent.startsWith('! booster-1') || 
        cleanContent.startsWith('!b-1') || 
        cleanContent.startsWith('! b-1')
    ) {
        if (!message.member.roles.cache.has(REQUIRED_ROLE_ID)) {
            return message.reply('❌ You do not have permission to use this command!');
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) return message.reply('❌ Please ping a person!');

        if (activeBoosters[targetUser.id]) {
            return message.reply(`⚠️ ${targetUser} is already on the daily Booster-1 list!`);
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
            message.reply('❌ Failed to connect to UnbelievaBoat.');
        }
    }
    
    else if (cleanContent.startsWith('!')) {
        return message.reply('❌ Unknown Command. Type `!help` to see what I can do!');
    }
});

client.on('error', console.error);

client.login(process.env.DISCORD_TOKEN);
    
