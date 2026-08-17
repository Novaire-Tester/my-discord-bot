const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { Client: UnbClient } = require('unb-api'); // UnbelievaBoat tool

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Connect to UnbelievaBoat using the token we added to Railway
const unb = new UnbClient(process.env.UNB_TOKEN);

const activeBoosters = {};

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('!test', { type: ActivityType.Listening });

    // 24-Hour Automated Loop
    setInterval(async () => {
        const now = Date.now();
        for (const userId in activeBoosters) {
            const data = activeBoosters[userId];
            if (now - data.lastRun >= 86400000) {
                try {
                    // This directly updates their UnbelievaBoat wallet!
                    await unb.editUserBalance(data.guildId, userId, { cash: 50000 });
                    
                    const channel = client.channels.cache.get(data.channelId);
                    if (channel) {
                        channel.send(`💰 **Daily Booster-1 payout!** Added 50,000 cash to <@${userId}> via UnbelievaBoat.`);
                    }
                    data.lastRun = now;
                } catch (err) {
                    console.error('Failed to add UB money daily:', err);
                }
            }
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
        const targetUser = message.mentions.users.first();
        if (!targetUser) return message.reply('Uh Oh! Please ping a person!');

        // Save tracking information
        activeBoosters[targetUser.id] = {
            guildId: message.guild.id,
            channelId: message.channel.id,
            lastRun: Date.now()
        };

        try {
            // Instantly add the first 50k to UnbelievaBoat
            await unb.editUserBalance(message.guild.id, targetUser.id, { cash: 50000 });
            
            message.channel.send(`✓✓ Successfully added 50,000 cash to ${targetUser}'s UnbelievaBoat balance!`);
            message.reply(`✓✓ Added ${targetUser} to the daily Booster-1 list.`);
        } catch (err) {
            console.error(err);
            message.reply('Uh Oh! Failed to connect to UnbelievaBoat. Double-check your UNB_TOKEN in Railway variables!');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
