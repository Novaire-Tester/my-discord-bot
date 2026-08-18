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

        // Security authorization check
        const hasStaffRole = interaction.member.roles.cache.some(role => config.STAFF_ROLES.includes(role.id));
        if (!hasStaffRole) {
            return interaction.reply({ content: "❌ Restricted access area.", ephemeral: true });
        }

        // 1. Root Level: Clicked Dashboard Button
        if (interaction.customId === 'open_dashboard') {
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('🎛️ Reward Options Menu')
                .setDescription("Configure how your booster rewards are claimed. Choose single selection or activate multiple prize pools.");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('toggle_multiple').setLabel('🔀 Mode: Multiple').setStyle(ButtonStyle.Success)
            );

            // Responds privately to the staff member inside the thread
            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        // 2. Root Level: Clicked Preview Button
        if (interaction.customId === 'open_preview') {
            await interaction.reply({ content: "🚧 The **Preview** function is locked for development and will be wired up later!", ephemeral: true });
        }

        // 3. Sub Level: Toggling Multiple Mode
        if (interaction.customId === 'toggle_multiple') {
            const embed = new EmbedBuilder()
                .setColor('#E67E22')
                .setTitle('🎛️ Reward Options Menu (Multi-Select)')
                .setDescription("🌟 **Multi-Select Active:** Staff can now select and stack multiple booster rewards simultaneously.");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('toggle_singular').setLabel('🔄 Mode: Singular').setStyle(ButtonStyle.Primary)
            );

            // Replaces the existing message layout directly without creating new text bubbles
            await interaction.update({ embeds: [embed], components: [row] });
        }

        // 4. Sub Level: Toggling back to Singular Mode
        if (interaction.customId === 'toggle_singular') {
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('🎛️ Reward Options Menu')
                .setDescription("Configure how your booster rewards are claimed. Choose single selection or activate multiple prize pools.");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('toggle_multiple').setLabel('🔀 Mode: Multiple').setStyle(ButtonStyle.Success)
            );

            await interaction.update({ embeds: [embed], components: [row] });
        }

    } catch (err) {
        console.error("⚠️ Interaction system error:", err);
    }
});

process.on('unhandledRejection', error => console.error('Logged Unhandled Rejection:', error));
process.on('uncaughtException', error => console.error('Logged Uncaught Exception:', error));

client.login(process.env.DISCORD_TOKEN);
