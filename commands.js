const fs = require('fs');
const path = require('path');
const historyPath = path.join(__dirname, 'history.json');

// Helper function to read/write offense history safely
function getHistory() {
    if (!fs.existsSync(historyPath)) return {};
    try { return JSON.parse(fs.readFileSync(historyPath, 'utf8')); } 
    catch (e) { return {}; }
}
function saveHistory(data) {
    fs.writeFileSync(historyPath, JSON.stringify(data, null, 4));
}
function addOffense(userId, type, details) {
    const history = getHistory();
    if (!history[userId]) history[userId] = [];
    history[userId].push({
        type: type,
        details: details,
        timestamp: new Date().toLocaleString()
    });
    saveHistory(history);
}

module.exports = {
    commandsList: {
        name: "commands",
        shortcuts: ["cmds", "c"],
        staffOnly: false,
        execute: async (message, config, { EmbedBuilder }) => {
            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle("📜 Public Commands List")
                .setDescription("Standard options accessible by everyone.")
                .addFields(
                    { name: ":commands (cmds, c)", value: "Displays this public interface guide." },
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
                .setColor("#ED4245")
                .setTitle("🛡️ Internal Staff Commands")
                .setDescription("Secure dashboard utility list restricted to management profiles.")
                .addFields(
                    { name: ":staff-commands (sc)", value: "Displays this directory." },
                    { name: ":booster-rewards (br)", value: "Opens interactive prize control panels." },
                    { name: ":moderation (mod)", value: "Reviews advanced staff logging options." },
                    { name: ":mute @user (time) (reason)", value: "Applies the mute server role restrictions." },
                    { name: ":unmute @user", value: "Clears the active restriction layer." },
                    { name: ":ban @user (temp/perm) (time) (reason)", value: "Executes administrative user bans." },
                    { name: ":unban ID", value: "Removes explicit target block restrictions." },
                    { name: ":warn @user (reason)", value: "Logs formal rule infraction warnings." },
                    { name: ":offenses @user", value: "Reviews comprehensive logged history records." }
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
                .setDescription("I am your custom utility bot managing automated panels, shortcuts, and moderation frameworks smoothly.");
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
                .setDescription(`Database values are fully tracked and verified by our secondary system infrastructure: <@${config.SECONDARY_BOT_ID}>.`);
            return message.reply({ embeds: [embed] });
        }
    },
    boosterRewards: {
        name: "booster-rewards",
        shortcuts: ["br", "rewards"],
        staffOnly: true,
        execute: async (message, config, { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle }) => {
            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle("🎮 Booster Rewards Hub")
                .setDescription("Welcome to the configuration area. Select an option below.");
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('open_dashboard').setLabel('🎛️ Dashboard').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('open_preview').setLabel('👁️ Preview').setStyle(ButtonStyle.Secondary)
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
                .setDescription("System moderation layer online. Use standard parameters like `:mute`, `:ban`, `:warn`, or `:offenses` to process actions.");
            return message.reply({ embeds: [embed] });
        }
    },
    
    // --- 🛠️ NEW FUNCTIONING MODERATION COMMAND SYSTEM ---
    mute: {
        name: "mute",
        shortcuts: ["timeout"],
        staffOnly: true,
        execute: async (message, config, { EmbedBuilder }) => {
            const target = message.mentions.members.first();
            if (!target) return message.reply("❌ Error: Missing configuration parameters. Format: `:mute @player (duration) (reason)`");
            
            const args = message.content.split(/ +/).slice(2);
            const duration = args[0] || "Not Specified";
            const reason = args.slice(1).join(" ") || "No reason provided.";

            try {
                await target.roles.add(config.MUTE_ROLE_ID);
                addOffense(target.id, "MUTE", `Duration: ${duration} | Reason: ${reason} | By: ${message.author.tag}`);
                
                const embed = new EmbedBuilder()
                    .setColor("#E67E22")
                    .setTitle("🔇 Member Muted Successfully")
                    .setDescription(`Target <@${target.id}> has been restricted.`)
                    .addFields(
                        { name: "🕒 Duration", value: duration, inline: true },
                        { name: "📝 Reason", value: reason, inline: true }
                    );
                return message.reply({ embeds: [embed] });
            } catch (e) {
                return message.reply("❌ API Operational Failure: Move bot hierarchy role higher than targets.");
            }
        }
    },
    unmute: {
        name: "unmute",
        shortcuts: ["untimeout"],
        staffOnly: true,
        execute: async (message, config, { EmbedBuilder }) => {
            const target = message.mentions.members.first();
            if (!target) return message.reply("❌ Error: Specify target. Format: `:unmute @player`");

            try {
                await target.roles.remove(config.MUTE_ROLE_ID);
                const embed = new EmbedBuilder()
                    .setColor("#2ECC71")
                    .setDescription(`🔊 <@${target.id}> has been unmuted successfully.`);
                return message.reply({ embeds: [embed] });
            } catch (e) {
                return message.reply("❌ Execution Error: Could not remove restriction layer.");
            }
        }
    },
    ban: {
        name: "ban",
        shortcuts: ["b"],
        staffOnly: true,
        execute: async (message, config, { EmbedBuilder }) => {
            const target = message.mentions.members.first();
            if (!target) return message.reply("❌ Error: Format: `:ban @player (temp/perm) (time/if temp) (reason)`");

            const args = message.content.split(/ +/).slice(2);
            const mode = args[0] ? args[0].toLowerCase() : "perm";
            let duration = "Permanent";
            let reason = "No reason provided.";

            if (mode === "temp") {
                duration = args[1] || "Not Specified";
                reason = args.slice(2).join(" ") || "No reason provided.";
            } else {
                reason = args.slice(1).join(" ") || "No reason provided.";
            }

            try {
                await target.ban({ reason: reason });
                addOffense(target.id, `BAN (${mode.toUpperCase()})`, `Duration: ${duration} | Reason: ${reason} | By: ${message.author.tag}`);

                const embed = new EmbedBuilder()
                    .setColor("#ED4245")
                    .setTitle("🔨 Member Banned Successfully")
                    .setDescription(`Target tracking ID context processed out of guild environment.`)
                    .addFields(
                        { name: "🗂️ Scope Mode", value: mode.toUpperCase(), inline: true },
                        { name: "🕒 Length", value: duration, inline: true },
                        { name: "📝 Reason", value: reason, inline: false }
                    );
                return message.reply({ embeds: [embed] });
            } catch (e) {
                return message.reply("❌ Security Core Blockage: Check target role authority tiers.");
            }
        }
    },
        unban: {
        name: "unban",
        shortcuts: ["ub"],
        staffOnly: true,
        execute: async (message, config, { EmbedBuilder }) => {
            const args = message.content.split(/ +/).slice(1);
            const targetId = args[0];
            if (!targetId) return message.reply("❌ Parameter tracking failed: Provide target numeric ID profile string. Format: `:unban 1234567890`");

            try {
                await message.guild.members.unban(targetId);
                const embed = new EmbedBuilder()
                    .setColor("#2ECC71")
                    .setDescription(`✅ User Profile ID \`${targetId}\` unbanned successfully.`);
                return message.reply({ embeds: [embed] });
            } catch (e) {
                return message.reply("❌ Directory Tracking Alert: ID element target is not currently banned.");
            }
        }
    },
    warn: {
        name: "warn",
        shortcuts: ["w"],
        staffOnly: true,
        execute: async (message, config, { EmbedBuilder }) => {
            const target = message.mentions.members.first();
            if (!target) return message.reply("❌ Error: Format parameters missing. Format: `:warn @player (reason)`");

            const reason = message.content.split(/ +/).slice(2).join(" ") || "No reason provided.";
            addOffense(target.id, "WARN", `Reason: ${reason} | By: ${message.author.tag}`);

            const embed = new EmbedBuilder()
                .setColor("#F1C40F")
                .setTitle("⚠️ Formal Warning Issued")
                .setDescription(`<@${target.id}> has received an official account warning update.`)
                .addFields({ name: "📝 Logged Reason", value: reason });
            return message.reply({ embeds: [embed] });
        }
    },
    offenses: {
        name: "offenses",
        shortcuts: ["history", "logs"],
        staffOnly: true,
        execute: async (message, config, { EmbedBuilder }) => {
            const userTarget = message.mentions.users.first();
            if (!userTarget) return message.reply("❌ Parameter verification missing. Format: `:offenses @player`");

            const history = getHistory();
            const userLogs = history[userTarget.id] || [];

            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR)
                .setTitle(`🗃️ Infraction Records for ${userTarget.username}`)
                .setDescription(userLogs.length === 0 
                    ? "✨ Clean Record. No logged infractions found inside history parameters." 
                    : userLogs.map((log, idx) => `\`[#${idx + 1}]\` **[${log.type}]** - ${log.details} *(Logged: ${log.timestamp})*`).join('\n\n'));

            return message.reply({ embeds: [embed] });
        }
    },
        serverBoosters: {
        name: "server-boosters",
        shortcuts: ["boosters", "sb"],
        staffOnly: false,
        execute: async (message, config, { EmbedBuilder }) => {
            // 1. Fetch all members live from the server cache to make sure we don't miss anyone
            const members = await message.guild.members.fetch();
            
            // 2. Filter down to ONLY members who are currently boosting
            const boosters = members.filter(member => member.premiumSinceTimestamp !== null);

            // 3. Build the display description text list
            let listText = "✨ **Current Supporters:**\n";

            if (boosters.size === 0) {
                listText += "ℹ️ *There are no active boosters on the server right now.*";
            } else {
                // Map out every booster into a mention string (e.g. • @User)
                listText += boosters.map(member => `• <@${member.user.id}>`).join("\n");
            }

            // 4. Send the beautiful, live booster embed
            const embed = new EmbedBuilder()
                .setColor("#F47FFF") // Pink Discord booster color
                .setTitle("💎 Active Server Boosters")
                .setDescription(`Thank you to everyone supporting our community!\n\n${listText}`)
                .setFooter({ text: `Total Active Boosters: ${boosters.size}` })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }
    }
};
