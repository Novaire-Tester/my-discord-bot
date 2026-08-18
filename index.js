const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
// ... (keep your existing setup logs and messageCreate event exactly as they are)

// A simple global object to track what prizes you selected in this session
let selectedPrizes = [];

client.on('interactionCreate', async (interaction) => {
    try {
        // Handle dropdown selection choices
        if (interaction.isStringSelectMenu() && interaction.customId === 'prize_selector') {
            selectedPrizes = interaction.values; // Stores whatever you picked
            
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('✅ Configuration Updated!')
                .setDescription(`You have successfully saved the following reward choices:\n\n${selectedPrizes.map(p => `• **${p.replace('_', ' ').toUpperCase()}**`).join('\n')}\n\nYou can view this setup anytime by using the **Preview** button!`);

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (!interaction.isButton()) return;

        // Security authorization check
        const hasStaffRole = interaction.member.roles.cache.some(role => config.STAFF_ROLES.includes(role.id));
        if (!hasStaffRole) return interaction.reply({ content: "❌ Restricted access area.", ephemeral: true });

        // Helper function to build the prize selector drop-down layout
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
                .setMaxValues(isMultipleMode ? 4 : 1) // Limits choices depending on selected mode
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

        // 1. Clicked Dashboard Button
        if (interaction.customId === 'open_dashboard') {
            await interaction.reply(buildDashboard(false));
        }

        // 2. Clicked Toggle to Multiple Mode
        if (interaction.customId === 'toggle_multiple') {
            await interaction.update(buildDashboard(true));
        }

        // 3. Clicked Toggle to Singular Mode
        if (interaction.customId === 'toggle_singular') {
            await interaction.update(buildDashboard(false));
        }

        // 4. Clicked Preview Button
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
