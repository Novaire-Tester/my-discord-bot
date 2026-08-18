const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder 
} = require('discord.js');
const fs = require('fs');

// --- 🛡️ CRASH GUARDS FOR INITIALIZATION ---
if (!fs.existsSync('./config.json')) {
    console.error("❌ CRASH PREVENTED: config.json file is missing from the directory!");
    process.exit(1);
}
const config = require('./config.json');

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
        GatewayIntentBits.GuildMembers 
    ]
});

// Cache storage for active menu selections
let selectedPrizes = [];

client.once('ready', () => {
    console.log(`🚀 ${client.user.tag} is online and listening for commands!`);
});

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

        await cmd.execute(message, config, { 
            EmbedBuilder, 
            ActionRowBuilder, 
            ButtonBuilder, 
            ButtonStyle 
        });
    } catch (err) {
        console.error("⚠️ Command Execution Error caught safely:", err);
    }
});

// --- 🎛️ INTERACTION HANDLER (BUTTONS & DROPDOWNS) ---
client.on('interactionCreate', async (interaction) => {
    try {
        // 1. Handle Selection Menu Dropdown Payout Updates
        if (interaction.isStringSelectMenu() && interaction.customId === 'prize_selector') {
            selectedPrizes = interaction.values; 
            
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('✅ Configuration Updated!')
                .setDescription(`You have successfully saved the following reward choices:\n\n${selectedPrizes.map(p => `• **${p.replace('_', ' ').toUpperCase()}**`).join('\n')}\n\nYou can view this setup anytime by using the **Preview** button!`);

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (!interaction.isButton()) return;

        // Security check for dashboard clicks
        const hasStaffRole = interaction.member.roles.cache.some(role => config.STAFF_ROLES.includes(role.id));
        if (!hasStaffRole) {
            return interaction.reply({ content: "❌ Restricted access area.", ephemeral: true });
        }

        // Internal UI builder function to minimize syntax errors
        const buildDashboard = (isMultipleMode) => {
            const embed = new EmbedBuilder()
                .setColor(isMultipleMode ? '#E67E22' : '#3498DB')
                .setTitle(isMultipleMode ? '🎛️ Dashboard (Multi-Select Mode)' : '🎛️ Dashboard (Singular Mode)')
                .setDescription(isMultipleMode 
                    ? "🌟 **Multi-Select Active:** Click the drop-down menu below. You can pick **multiple options** at once to stack rewards!" 
                    : "Choose **one single prize tier** from the menu dropdown below for your server boosters.");

            const modeButton = new ButtonBuilder()
                .setCustomId(isMultipleMode ? 'toggle_singular' : 'toggle_multiple')
                .setLabel(isMultipleMode ? '🔄 Mode: Singular' : '🔀 Mode: Multiple')
                .setStyle(isMultipleMode ? ButtonStyle.Primary : ButtonStyle.Success);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('prize_selector')
                .setPlaceholder('🎁 Click here to choose reward prizes...')
                .setMinValues(1)
                .setMaxValues(isMultipleMode ? 4 : 1)
                .addOptions([
                    new StringSelectMenuOptionBuilder().setLabel('$5,000 Cash Payout').setValue('cash_5k').setDescription('Instantly rewards the user with $5k UNB cash.'),
                    new StringSelectMenuOptionBuilder().setLabel('$25,000 High Tier Payout').setValue('cash_25k').setDescription('Instantly rewards the user with $25k UNB cash.'),
                    new StringSelectMenuOptionBuilder().setLabel('VIP Premium Role').setValue('role_vip').setDescription('Grants the subscriber the automated VIP server tier.'),
                    new StringSelectMenuOptionBuilder().setLabel('Multiplier Booster Role').setValue('role_multiplier').setDescription('Grants access to active economy multipliers.')
                ]);

            return {
                embeds: [embed],
                components: [
                    new ActionRowBuilder().addComponents(modeButton),
                    new ActionRowBuilder().addComponents(selectMenu)
                ],
                ephemeral: true
            };
        };

        // 2. Clicked Dashboard Interface button
        if (interaction.customId === 'open_dashboard') {
            await interaction.reply(buildDashboard(false));
        }

        // 3. Clicked Toggle to Multiple Mode button
        if (interaction.customId === 'toggle_multiple') {
            await interaction.update(buildDashboard(true));
        }

        // 4. Clicked Toggle to Singular Mode button
        if (interaction.customId === 'toggle_singular') {
            await interaction.update(buildDashboard(false));
        }

        // 5. Clicked Preview Panel button
        if (interaction.customId === 'open_preview') {
            const embed = new EmbedBuilder()
                .setColor('#F1C40F')
                .setTitle('👁️ Live Reward Configuration Preview')
                .setDescription(selectedPrizes.length > 0 
                    ? `Here is your currently configured prize setup:\n\n${selectedPrizes.map(p => `• **${p.replace('_', ' ').toUpperCase()}**`).join('\n')}`
                    : "⚠️ No prizes are selected yet! Open the **Dashboard** to configure choices first.");

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

    } catch (err) {
        console.error("⚠️ Interaction system error:", err);
    }
});

// --- 💥 GLOBAL ANTI-CRASH EVENT LISTENERS ---
process.on('unhandledRejection', error => console.error('Logged Unhandled Rejection:', error));
process.on('uncaughtException', error => console.error('Logged Uncaught Exception:', error));

client.login(process.env.DISCORD_TOKEN);
