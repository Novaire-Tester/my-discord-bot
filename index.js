const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('!test', { type: ActivityType.Listening });
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
});

client.login(process.env.DISCORD_TOKEN);
