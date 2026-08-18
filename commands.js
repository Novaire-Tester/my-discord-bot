module.exports = {
    commandsList: {
        name: "commands",
        shortcuts: ["cmds", "c"],
        staffOnly: false,
        execute: async (message) => {
            return message.reply(
                "📜 **Available Commands:**\n" +
                "▫ `:commands` (Shortcuts: `cmds`, `c`) - Shows this help dashboard.\n" +
                "▫ `:help` (Shortcuts: `h`) - Brief summary of what I can do.\n" +
                "▫ `:values` (Shortcuts: `v`) - Explains who manages the values.\n" +
                "🔒 **Staff Only:**\n" +
                "▫ `:booster-rewards` (Shortcuts: `br`, `rewards`) - Payout setup board.\n" +
                "▫ `:moderation` (Shortcuts: `mod`, `m`) - Detailed staff information."
            );
        }
    },
    help: {
        name: "help",
        shortcuts: ["h"],
        staffOnly: false,
        execute: async (message) => {
            return message.reply("👋 **What I do:** I am your custom utility assistant, managing automated info dashboards, staff utilities, and shortcut menus!");
        }
    },
    values: {
        name: "values",
        shortcuts: ["v"],
        staffOnly: false,
        execute: async (message, config) => {
            return message.reply(`ℹ **Values Notice:** The primary authority managing values is our second bot: <@${config.SECONDARY_BOT_ID}>.`);
        }
    },
    boosterRewards: {
        name: "booster-rewards",
        shortcuts: ["br", "rewards"],
        staffOnly: true,
        execute: async (message, config, { ActionRowBuilder, ButtonBuilder, ButtonStyle }) => {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('edit_prize_1').setLabel('🎁 Customize Prize 1').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('edit_prize_2').setLabel('✨ Customize Prize 2').setStyle(ButtonStyle.Secondary)
            );
            return message.reply({ content: "🛠 **Booster Rewards Configuration Dashboard:**\nSelect a setting below to customize future reward prizes.", components: [row] });
        }
    },
    moderation: {
        name: "moderation",
        shortcuts: ["mod", "m"],
        staffOnly: true,
        execute: async (message) => {
            return message.reply("🛡 **Staff Moderation System:** Placeholder text. Drop your detailed layout requirements when you are ready to expand this!");
        }
    }
};
