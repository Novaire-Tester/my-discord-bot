module.exports = {
    commandsList: {
        name: "commands",
        shortcuts: ["cmds", "c"],
        staffOnly: false,
        execute: async (message, config, { EmbedBuilder }) => {
            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle("📜 Public Commands List")
                .setDescription("Here are the standard commands accessible by everyone.")
                .addFields(
                    { name: "Prefix", value: `\`${config.PREFIX}\``, inline: true },
                    { name: ":commands (cmds, c)", value: "Displays this public system index dashboard." },
                    { name: ":help (h)", value: "Displays a short overview of bot features." },
                    { name: ":values (v)", value: "Clarifies balance currency management authorities." }
                );
            return message.reply({ embeds: [embed] });
        }
    },
    staffCommandsList: {
        name: "staff-commands",
        shortcuts: ["sc", "scommands"],
        staffOnly: true,
        execute: async (message, config, { EmbedBuilder }) => {
            const embed = new EmbedBuilder()
                .setColor("#ED4245") // Red highlight for secure admin space
                .setTitle("🛡️ Internal Staff Commands")
                .setDescription("Secure dashboard utility list restricted to management profiles.")
                .addFields(
                    { name: ":staff-commands (sc)", value: "Displays this hidden staff directory." },
                    { name: ":booster-rewards (br, rewards)", value: "Opens interactive prize control panels." },
                    { name: ":moderation (mod, m)", value: "Reviews advanced staff logging parameters." }
                );
            return message.reply({ embeds: [embed] });
        }
    },
    help: {
        name: "help",
        shortcuts: ["h"],
        staffOnly: false,
        execute: async (message, config, { EmbedBuilder }) => {
            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle("👋 Welcome Menu")
                .setDescription("I am your custom utility bot! I manage automated staff tools, info boards, layout shortcuts, and role verification triggers smoothly.");
            return message.reply({ embeds: [embed] });
        }
    },
    values: {
        name: "values",
        shortcuts: ["v"],
        staffOnly: false,
        execute: async (message, config, { EmbedBuilder }) => {
            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle("ℹ️ System Balance Notice")
                .setDescription(`Please note that database values are entirely tracked and verified by our secondary system infrastructure: <@${config.SECONDARY_BOT_ID}>.`);
            return message.reply({ embeds: [embed] });
        }
    },
// Inside commands.js - Replace your boosterRewards section with this:
boosterRewards: {
    name: "booster-rewards",
    shortcuts: ["br", "rewards"],
    staffOnly: true,
    execute: async (message, config, { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle }) => {
        const embed = new EmbedBuilder()
            .setColor(config.EMBED_COLOR)
            .setTitle("🎮 Booster Rewards Hub")
            .setDescription("Welcome to the configuration area. Select an interface option below.");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('open_dashboard').setLabel('🎛️ Dashboard').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('open_preview').setLabel('👁️ Preview (Coming Soon)').setStyle(ButtonStyle.Secondary)
        );

        return message.reply({ embeds: [embed], components: [row] });
    }
},
    moderation: {
        name: "moderation",
        shortcuts: ["mod", "m"],
        staffOnly: true,
        execute: async (message, config, { EmbedBuilder }) => {
            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle("🛡️ Staff Moderation Dashboard")
                .setDescription("System module active. Ready for functional logging details.");
            return message.reply({ embeds: [embed] });
        }
    }
};
