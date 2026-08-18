const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config.json');
const commands = require('./commands');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => console.log(`🚀 ${client.user.tag} is online and organized!`));

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(config.PREFIX)) return;

    // Grab the base command name/shortcut and clean it up
    const args = message.content.slice(config.PREFIX.length).trim().split(/ +/);
    const commandInput = args.shift().toLowerCase();

    // Find if the input matches a primary command or its shortcut
    const cmd = Object.values(commands).find(c => c.name === commandInput || c.shortcuts.includes(commandInput));
    if (!cmd) return;

    // Check staff permissions if the command requires it
    if (cmd.staffOnly) {
        const hasStaffRole = message.member.roles.cache.some(role => config.STAFF_ROLES.includes(role.id));
        if (!hasStaffRole) return message.reply("❌ You do not have permission to use this staff command.");
    }

    // Execute the command action directly
    await cmd.execute(message, config, { ActionRowBuilder, ButtonBuilder, ButtonStyle });
});

client.login(process.env.DISCORD_TOKEN);
