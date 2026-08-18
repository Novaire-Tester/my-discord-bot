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
        execute: async (message, config) => {
            const menuText = 
                "■ ────────────── Commands List ────────────── ■\n\n" +
                "Standard operational utilities accessible by everyone:\n\n" +
                `:commands || Shortcuts: cmds, c || Displays this public index directory.\n` +
                `:help || Shortcuts: h || Displays a short overview of bot features.\n` +
                `:values || Shortcuts: v || Clarifies balance currency management authorities.\n` +
                `:server-boosters || Shortcuts: boosters, sb || Scans the server live to display all active boosters.\n` +
                `:booster-commands || Shortcuts: bc || Displays hidden booster reward directories.\n\n` +
                "■ ────────────────────────────────────────── ■";
            return message.reply({ content: menuText });
        }
    },
    staffCommandsList: {
        name: "staff-commands",
        shortcuts: ["sc", "scommands"],
        staffOnly: true,
        execute: async (message, config) => {
            const menuText = 
                "■ ────────────── Staff Commands ────────────── ■\n\n" +
                "Secure utility list restricted to authorized management roles:\n\n" +
                ":staff-commands || Shortcuts: sc || Displays this directory.\n" +
                ":booster-rewards || Shortcuts: br || Opens interactive prize control panels with multi-select buttons.\n" +
                ":moderation || Shortcuts: mod || Reviews advanced staff logging options.\n" +
                ":mute @user (time) (why) || Applies the configured mute server role restrictions.\n" +
                ":unmute @user || Clears the active mute restriction layer instantly.\n" +
                ":ban @user (temp/perm) (time) (why) || Executes administrative user ban infrastructure records.\n" +
                ":unban ID || Removes explicit target block restrictions using their user ID.\n" +
                ":warn @user (why) || Logs a formal rule infraction warning directly to history files.\n" +
                ":offenses @user || Reviews comprehensive logged infraction history files for a user.\n\n" +
                "■ ──────────────────────────────────────────── ■";
            return message.reply({ content: menuText });
        }
    },
    boosterCommandsList: {
        name: "booster-commands",
        shortcuts: ["bc"],
        staffOnly: false,
        execute: async (message, config) => {
            const isBooster = message.member.roles.cache.has(config.BOOSTER_ROLE_ID);
            if (!isBooster) {
                return message.reply({ 
                    content: "Error: This command directory is strictly restricted to active server boosters.", 
                    ephemeral: true 
                });
            }

            const menuText = 
                "■ ────────────── Booster Commands ────────────── ■\n\n" +
                "Available rewards commands and custom parameters for server supporters:\n\n" +
                ":claim-daily || Claim your active 24-hour booster economy payout.\n" +
                ":booster-perks || View an index of custom roles and perks available to your tier.\n\n" +
                "■ ────────────────────────────────────────────── ■";

            return message.reply({ content: menuText, ephemeral: true });
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
        execute: async (message) => {
            const userTarget = message.mentions.users.first();
            if (!userTarget) return message.reply("Error: Parameter verification missing. Format: :offenses @player");

            const history = getHistory();
            const userLogs = history[userTarget.id] || [];

            if (userLogs.length === 0) {
                return message.reply(`Infraction Records for ${userTarget.username}:\nClean Record. No logged infractions found inside history parameters.`);
            }

            const logLines = userLogs.map((log, idx) => `[#${idx + 1}] [${log.type}] - ${log.details} (Logged: ${log.timestamp})`).join('\n');
            return message.reply(`Infraction Records for ${userTarget.username}:\n\n${logLines}`);
        }
    },
    serverBoosters: {
        name: "server-boosters",
        shortcuts: ["boosters", "sb"],
        staffOnly: false,
        execute: async (message) => {
            const members = await message.guild.members.fetch();
            const boosters = members.filter(member => member.premiumSinceTimestamp !== null);

            let listText = "Current Supporters:\n";

            if (boosters.size === 0) {
                listText += "There are no active boosters on the server right now.";
            } else {
                listText += boosters.map(member => `• <@${member.user.id}>`).join("\n");
            }

            return message.reply(`Active Server Boosters\nThank you to everyone supporting our community!\n\n${listText}\n\nTotal Active Boosters: ${boosters.size}`);
        }
    }
};
