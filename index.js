const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// This object will temporarily hold active boosters while the bot stays online
const activeBoosters = {};

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('!test', { type: ActivityType.Listening });

    // Check every hour (3600000ms) to see if it's time to run the daily command
    setInterval(() => {
        const now = Date.now();
        for (const userId in activeBoosters) {
            const data = activeBoosters[userId];
            // If 24 hours (86400000ms) have passed since the last run
            if (now - data.lastRun >= 86400000) {
                const channel = client.channels.cache.get(data.channelId);
                if (channel) {
                    channel.send(`;add-money <@${userId}> 50,000`);
                    data.lastRun = now; // Reset the 24-hour timer
                }
            }
        }
    }, 3600000); 
});

client.on('messageCreate', (message) => {
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
        const targetUser = message.mentions.users.first();
        
        if (!targetUser) {
            return message.reply('Uh oh!! Please ping a person! Example: `!Booster-1 @person`');
        }

        // Add them to the daily cycle
        activeBoosters[targetUser.id] = {
            channelId: message.channel.id,
            lastRun: Date.now() // Sets the starting point to right now
        };

        // Send the very first immediate message right now
        message.channel.send(`;add-money ${targetUser} 50,000`);
        message.reply(`✓ Added ${targetUser} to the Booster 1 Perks list. I will repeat this command every 24 hours!`);
    }
});

client.login(process.env.DISCORD_TOKEN);
