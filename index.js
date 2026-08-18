const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

// Guard against missing config file crash
if (!fs.existsSync('./config.json')) {
    console.error("❌ CRASH PREVENTED: config.json file is missing from the directory!");
    process.exit(1);
}
const config = require('./config.json');

// Guard against missing commands file crash
if (!fs.existsSync('./commands.js')) {
    console.error("❌ CRASH PREVENTED: commands.js file is missing from the directory!");
    process.exit(1);
}
const commands = require('./commands');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers // Required to check staff roles safely
    ]
});

client.once('ready', () => console.log(`🚀 ${client.user.tag} is safe, online, and organized!`));

client.on('messageCreate', async (message) => {
    try {
        if (message.author.bot || !message.content.startsWith(config.PREFIX)) return;

        const args = message.content.slice(config.PREFIX.length).trim().split(/ +/);
        const commandInput = args.shift().toLowerCase();

        const cmd = Object.values(commands).find(c => c.name === commandInput || (c.shortcuts && c.shortcuts.includes(commandInput)));
        if (!cmd) return;

        if (cmd.staffOnly) {
            if (!message.member) return; // Guard against DM errors
            const hasStaffRole = message.member.roles.cache.some(role => config.STAFF_ROLES.includes(role.id));
            if (!hasStaffRole) return; 
        }

        await cmd.execute(message, config, { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle });
    } catch (err) {
        console.error("⚠️ Command Execution Error caught safely:", err);
    }
});

// Global crash handlers to keep Railway alive if an outside API drops
process.on('unhandledRejection', error => console.error('Logged Unhandled Rejection:', error));
process.on('uncaughtException', error => console.error('Logged Uncaught Exception:', error));

client.login(process.env.DISCORD_TOKEN);
