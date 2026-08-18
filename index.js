const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config.json');
const commands = require('./commands');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => console.log(`🚀 Embed System Online!`));

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(config.PREFIX)) return;

    const args = message.content.slice(config.PREFIX.length).trim().split(/ +/);
    const commandInput = args.shift().toLowerCase();

    const cmd = Object.values(commands).find(c => c.name === commandInput || c.shortcuts.includes(commandInput));
    if (!cmd) return;

    if (cmd.staffOnly) {
        const hasStaffRole = message.member.roles.cache.some(role => config.STAFF_ROLES.includes(role.id));
        if (!hasStaffRole) return; // Silent ignore or permission error embed
    }

    // Pass EmbedBuilder down into our commands file seamlessly
    await cmd.execute(message, config, { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle });
});

client.login(process.env.DISCORD_TOKEN);
