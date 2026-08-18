const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

if (!fs.existsSync('./config.json')) {
    console.error("❌ CRASH PREVENTED: config.json file is missing!");
    process.exit(1);
}
const config = require('./config.json');

if (!fs.existsSync('./commands.js')) {
    console.error("❌ CRASH PREVENTED: commands.js file is missing!");
    process.exit(1);
}
const commands = require('./commands');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ]
});

client.once('ready', () => console.log(`🚀 ${client.user.tag} is online and listening for buttons!`));

// --- 💬 MESSAGE COMMAND HANDLER ---
client.on('messageCreate', async (message) => {
    try {
        if (message.author.bot || !message.content.startsWith(config.PREFIX)) return;

        const args = message.content.slice(config.PREFIX.length).trim().split(/ +/);
        const commandInput = args.shift().toLowerCase();

        const cmd = Object.values(commands).find(c => c.name === commandInput || (c.shortcuts && c.shortcuts.includes(commandInput)));
        if (!cmd) return;

        if (cmd.staffOnly) {
            if (!message.member) return; 
            const hasStaffRole = message.member.roles.cache.some(role => config.STAFF_ROLES.includes(role.id));
            if (!hasStaffRole) return; 
        }

        await cmd.execute(message, config, { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle });
    } catch (err) {
        console.error("⚠️ Command Execution Error caught safely:", err);
    }
});

// --- 🎛️ BUTTON INTERACTION HANDLER ---
client.on('interactionCreate', async (interaction) => {
    try {
        if (!interaction.isButton()) return;

        // Secure security check: Only allow staff to use the dashboard buttons
        const hasStaffRole = interaction.member.roles.cache.some(role => config.STAFF_ROLES.includes(role.id));
        if (!hasStaffRole) {
            return interaction.reply({ 
                content: "❌ You do not have permission to manage booster rewards.", 
                ephemeral: true 
            });
        }

        // Logic for Prize 1 Button
        if (interaction.customId === 'edit_prize_1') {
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('🎁 Prize 1 Customization Menu')
                .setDescription('You clicked to customize **Prize 1**. Options to change cash amounts or role requirements will go here next.');

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Logic for Prize 2 Button
        if (interaction.customId === 'edit_prize_2') {
            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle('✨ Prize 2 Customization Menu')
                .setDescription('You clicked to customize **Prize 2**. System layers for adjusting secondary reward values will go here next.');

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

    } catch (err) {
        console.error("⚠️ Interaction Error caught safely:", err);
    }
});

process.on('unhandledRejection', error => console.error('Logged Unhandled Rejection:', error));
process.on('uncaughtException', error => console.error('Logged Uncaught Exception:', error));

client.login(process.env.DISCORD_TOKEN);
