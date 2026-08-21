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
                .setColor(config.EMBED_COLOR || "#5865F2")
                .setTitle("❀───»───✧ Commands List ✧───«───❀")
                .setDescription(
                    "Standard operational utilities accessible by everyone:\n\n" +
                    "**:commands** (cmds, c) | Displays this public index directory.\n" +
                    "**:help** (h) | Displays a short overview of bot features.\n" +
                    "**:values** (v) | Clarifies balance currency management authorities.\n" +
                    "**:server-boosters** (boosters, sb) | Scans live server to display active boosters.\n" +
                    "**:booster-commands** (bc) | Displays hidden booster reward directories."
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
                .setTitle("❀──»───✧ Staff Commands ✧───«──❀")
                .setDescription(
                    "Secure utility list restricted to authorized management roles:\n\n" +
                    "**:staff-commands** (sc) | Displays this directory.\n" +
                    "**:influencer** (inf) @user | Toggles the Influencer profile role.\n" +
                    "**:booster-rewards** (br) | Opens interactive prize control panels.\n" +
                    "**:moderation** (mod) | Reviews advanced staff logging options.\n" +
                    "**:mute** @user (time) (why) | Applies mute server role restrictions.\n" +
                    "**:unmute** @user | Clears active mute restriction layer.\n" +
                    "**:ban** @user (temp/perm) (time) (why) | Executes user ban records.\n" +
                    "**:unban** ID | Removes block restrictions using user ID.\n" +
                    "**:warn** @user (why) | Logs formal rule infraction warnings.\n" +
                    "**:offenses** @user | Reviews comprehensive logged history records.\n"
                );
            
            return message.reply({ embeds: [embed] });
            
        }
    },
        boosterCommandsList: {
        name: "booster-commands",
        shortcuts: ["bc"],
        staffOnly: false,
        execute: async (message, config, { EmbedBuilder }) => {
            const isBooster = message.member.roles.cache.has(config.BOOSTER_ROLE_ID);
            if (!isBooster) {
                return message.reply({ 
                    content: "Error: This command directory is strictly restricted to active server boosters.", 
                    ephemeral: true 
                });
            }

            const embed = new EmbedBuilder()
                .setColor("#F47FFF")
                .setTitle("❀──»──✧ Booster Commands ✧──«──❀")
                .setDescription(
                    "Available rewards commands and custom parameters for server supporters:\n\n" +
                    "**:claim-daily** | Claim your active 24-hour booster economy payout.\n" +
                    "**:booster-perks** | View an index of custom roles and perks available to your tier."
                );

            return message.reply({ embeds: [embed], ephemeral: true });
        }
    },
    help: {
        name: "help",
        shortcuts: ["h"],
        staffOnly: false,
        execute: async (message) => {
            return message.reply("Standard utility system managing automated panels, shortcuts, and moderation frameworks smoothly.");
        }
    },
    values: {
        name: "values",
        shortcuts: ["v"],
        staffOnly: false,
        execute: async (message, config) => {
            return message.reply(`Database values are fully tracked and verified by our secondary system infrastructure: <@${config.SECONDARY_BOT_ID}>.`);
        }
    },
    boosterRewards: {
        name: "booster-rewards",
        shortcuts: ["br", "rewards"],
        staffOnly: true,
        execute: async (message, config, { ActionRowBuilder, ButtonBuilder, ButtonStyle }) => {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('open_dashboard').setLabel('Dashboard').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('open_preview').setLabel('Preview').setStyle(ButtonStyle.Secondary)
            );
            return message.reply({ content: "Booster Rewards Configuration Hub. Select an option below:", components: [row] });
        }
    },
    moderation: {
        name: "moderation",
        shortcuts: ["mod", "m"],
        staffOnly: true,
        execute: async (message) => {
            return message.reply("System moderation layer online. Use standard parameters like :mute, :ban, :warn, or :offenses to process actions.");
        }
    },
    mute: {
        name: "mute",
        shortcuts: ["timeout"],
        staffOnly: true,
        execute: async (message, config) => {
            const target = message.mentions.members.first();
            if (!target) return message.reply("Error: Invalid configuration. Format: :mute @player (time) (reason)");
            
            const args = message.content.split(/ +/).slice(2);
            const duration = args[0] || "Not Specified";
            const reason = args.slice(1).join(" ") || "No reason provided.";

            try {
                await target.roles.add(config.MUTE_ROLE_ID);
                addOffense(target.id, "MUTE", `Duration: ${duration} | Reason: ${reason} | By: ${message.author.tag}`);
                return message.reply(`<@${target.id}> has been muted successfully for ${duration} || reason: ${reason}`);
            } catch (e) {
                return message.reply("Error: Bot hierarchy level insufficient to complete muting routine.");
            }
        }
    },
    unmute: {
        name: "unmute",
        shortcuts: ["untimeout"],
        staffOnly: true,
        execute: async (message, config) => {
            const target = message.mentions.members.first();
            if (!target) return message.reply("Error: Invalid parameter. Format: :unmute @player");

            try {
                await target.roles.remove(config.MUTE_ROLE_ID);
                return message.reply(`<@${target.id}> has been unmuted successfully`);
            } catch (e) {
                return message.reply("Error: Could not strip mute server role layer.");
            }
        }
    },
        ban: {
        name: "ban",
        shortcuts: ["b"],
        staffOnly: true,
        execute: async (message, config) => {
            const target = message.mentions.members.first();
            if (!target) return message.reply("Error: Invalid layout. Format: :ban @player (temp/perm) (time) (reason)");

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
                return message.reply(`<@${target.id}> has been banned (${mode.toUpperCase()}) successfully for ${duration} || reason: ${reason}`);
            } catch (e) {
                return message.reply("Error: Check target role tier lists or permissions.");
            }
        }
    },
    unban: {
        name: "unban",
        shortcuts: ["ub"],
        staffOnly: true,
        execute: async (message) => {
            const args = message.content.split(/ +/).slice(1);
            const targetId = args[0];
            if (!targetId) return message.reply("Error: Missing profile target. Format: :unban ID");

            try {
                await message.guild.members.unban(targetId);
                return message.reply(`<@${targetId}> has been unbanned successfully`);
            } catch (e) {
                return message.reply("Error: Target element is not currently banned.");
            }
        }
    },
    warn: {
        name: "warn",
        shortcuts: ["w"],
        staffOnly: true,
        execute: async (message) => {
            const target = message.mentions.members.first();
            if (!target) return message.reply("Error: Missing parameters. Format: :warn @player (reason)");

            const reason = message.content.split(/ +/).slice(2).join(" ") || "No reason provided.";
            addOffense(target.id, "WARN", `Reason: ${reason} | By: ${message.author.tag}`);
            return message.reply(`<@${target.id}> has been warned successfully || reason: ${reason}`);
        }
    },
    offenses: {
        name: "offenses",
        shortcuts: ["history", "logs"],
        staffOnly: true,
        execute: async (message, config, { EmbedBuilder }) => {
            const userTarget = message.mentions.users.first();
            if (!userTarget) return message.reply("Error: Parameter verification missing. Format: :offenses @player");

            const history = getHistory();
            const userLogs = history[userTarget.id] || [];

            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR || "#5865F2")
                .setTitle(`Infraction Records | ${userTarget.username}`)
                .setDescription(userLogs.length === 0 
                    ? "Clean Record. No logged infractions found inside history parameters." 
                    : userLogs.map((log, idx) => `[#${idx + 1}] [${log.type}] - ${log.details} (Logged: ${log.timestamp})`).join('\n\n'));

            return message.reply({ embeds: [embed] });
        }
    },
        influencerRoleToggle: {
        name: "influencer",
        shortcuts: ["inf"],
        staffOnly: true,
        execute: async (message) => {
            const target = message.mentions.members.first();
            if (!target) return message.reply("Error: Missing execution target parameter. Format: :influencer @player");

            const roleId = "1538341462125842432";

            try {
                if (!target.roles.cache.has(roleId)) {
                    await target.roles.add(roleId);
                    return message.reply(`<@${target.id}> has been granted the **Influencer** role successfully`);
                } else {
                    await target.roles.remove(roleId);
                    return message.reply(`<@${target.id}> has had the **Influencer** role removed successfully`);
                }
            } catch (e) {
                return message.reply("Error: Bot hierarchy level insufficient to modify the requested profile layer.");
            }
        }
    },
    serverBoosters: {
        name: "server-boosters",
        shortcuts: ["boosters", "sb"],
        staffOnly: false,
        execute: async (message, config, { EmbedBuilder }) => {
            const members = await message.guild.members.fetch();
            const boosters = members.filter(member => member.premiumSinceTimestamp !== null);

            let listText = "Current Supporters:\n";

            if (boosters.size === 0) {
                listText += "There are no active boosters on the server right now.";
            } else {
                listText += boosters.map(member => `• <@${member.user.id}>`).join("\n");
            }

            const embed = new EmbedBuilder()
                .setColor("#F47FFF") 
                .setTitle("Active Server Boosters")
                .setDescription(`Thank you to everyone supporting our community!\n\n${listText}`)
                .setFooter({ text: `Total Active Boosters: ${boosters.size}` })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }
    }
};
