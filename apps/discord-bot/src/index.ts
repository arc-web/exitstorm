/**
 * ExitStorm Discord Bot — Main Entry Point
 *
 * Slash commands:
 *   /leaderboard   — contribution leaderboard (public)
 *   /mypoints      — your profile (ephemeral)
 *   /profile       — another member's profile (public)
 *   /history       — contribution audit log
 *   /stats         — system-wide stats
 *   /vouch         — vouch for a member (+5 pts)
 *   /linkgithub    — link GitHub account
 *   /projects      — browse community projects & tasks
 *   /proposeproject — propose a new community project
 *   /addtask       — [admin] add task to a project
 *
 * On /proposeproject:
 *   1. Creates a 24hr community poll
 *   2. Fires async financial analysis via @exitstorm/analyzer
 *   3. Posts analysis embed, AI-generated graphics, and team recommendations
 *   4. Points allocation calculated via @exitstorm/team-engine
 */

import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  Events,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { ContributionDB } from '@exitstorm/db';
import { analyzeProject } from '@exitstorm/analyzer';
import { generateProjectGraphics } from '@exitstorm/graphics';
import { recommendTeam, allocateProjectPoints } from '@exitstorm/team-engine';
import type { ProjectAnalysis } from '@exitstorm/core';

// ── Config ─────────────────────────────────────────────────────────────────

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required in .env file');
  process.exit(1);
}

const DB_PATH = process.env.DB_PATH ?? '../../data/contributions.db';
const db = new ContributionDB(DB_PATH).init();

// ── Client Setup ───────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// ── Command Handler ────────────────────────────────────────────────────────

async function handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const { commandName } = interaction;

  switch (commandName) {
    case 'leaderboard': {
      const leaders = db.getLeaderboard({ limit: 15 });
      const medals = ['🥇', '🥈', '🥉'];
      const lines = leaders.map((m, i) => {
        const rank = medals[i] ?? `${i + 1}.`;
        return `${rank} **${m.display_name || m.username}** — ${m.total_points} pts · Lv.${m.level}`;
      });
      await interaction.reply({
        content: `🏆 **Leaderboard — All Time**\n\n${lines.join('\n') || '_no contributors yet_'}`,
      });
      break;
    }

    case 'mypoints': {
      const member = db.getMember(interaction.user.id);
      if (!member) {
        await interaction.reply({ content: 'No points yet — start contributing!', ephemeral: true });
        break;
      }
      const breakdown = db.getPointBreakdown(interaction.user.id);
      const breakdownLines = breakdown.map(
        (b) => `**${b.type.replace(/_/g, ' ')}**: ${b.total_points} pts (${b.count}×)`,
      );
      await interaction.reply({
        content: [
          `🌟 **${member.display_name || member.username}** — ${member.total_points} pts · Lv.${member.level} ${member.level_name}`,
          '',
          breakdownLines.join('\n') || '_no contributions yet_',
        ].join('\n'),
        ephemeral: true,
      });
      break;
    }

    case 'proposeproject': {
      const title = interaction.options.getString('title', true).trim();
      const description = interaction.options.getString('description', true).trim();

      db.upsertMember(interaction.user.id, interaction.user.username, interaction.user.displayName);

      await interaction.reply({
        content: `🚀 **${title}** proposed! Running financial analysis...`,
      });

      // Fire async analysis
      try {
        const analysis: ProjectAnalysis = await analyzeProject(title, description);
        const team = await recommendTeam(title, analysis, db);
        const points = allocateProjectPoints(title, analysis);

        const scoreEmoji = analysis.priorityScore >= 8 ? '🔥' : analysis.priorityScore >= 7 ? '🟢' : analysis.priorityScore >= 5 ? '🟡' : '🔴';

        await interaction.followUp({
          content: [
            `📊 **Financial Analysis — ${title}**`,
            ``,
            `**Type:** ${analysis.appType} · ${analysis.market} · ${analysis.pricingModel}`,
            `**Priority:** ${analysis.priorityScore}/10 ${scoreEmoji} — ${analysis.priorityVerdict}`,
            `**ARR (12mo):** $${(analysis.arr12mo.conservative / 1000).toFixed(0)}K – $${(analysis.arr12mo.optimistic / 1000).toFixed(0)}K (realistic: $${(analysis.arr12mo.realistic / 1000).toFixed(0)}K)`,
            `**Valuation:** $${(analysis.valuation12mo.low / 1000).toFixed(0)}K – $${(analysis.valuation12mo.high / 1000).toFixed(0)}K (${analysis.valuation12mo.multiple})`,
            `**Breakeven:** ${analysis.monthsToBreakeven} months · **Exit:** ${analysis.speedToExit}`,
            ``,
            `**Team Points:** ${points.totalPoints.toLocaleString()} pts available (${points.multiplier}x multiplier)`,
            ``,
            `👥 **Recommended Team:**`,
            ...team.map((t) =>
              t.userId
                ? `  • **${t.role}**: <@${t.userId}> — ${t.reason}`
                : `  • **${t.role}**: _${t.reason}_`,
            ),
            ``,
            `> ${analysis.reasoning}`,
          ].join('\n'),
        });

        // Generate graphics (best-effort)
        try {
          const graphics = await generateProjectGraphics(title, analysis);
          const channel = interaction.channel;
          if (channel && 'send' in channel) {
            for (const [label, path] of [
              ['📈 Pricing Model', graphics.pricingChart],
              ['🗺️ Path to Exit', graphics.exitChart],
              ['🔭 Competitor Landscape', graphics.competitorLandscape],
            ] as const) {
              if (path) {
                await (channel as { send: Function }).send({
                  content: `**${label}** — ${title}`,
                  files: [path],
                });
              }
            }
          }
        } catch (gfxErr) {
          console.error('[graphics] Failed (non-fatal):', gfxErr);
        }
      } catch (err) {
        console.error('[proposeproject] Analysis failed:', err);
        await interaction.followUp({
          content: '⚠️ Financial analysis failed — the proposal is still recorded. Missing API key?',
        });
      }
      break;
    }

    default: {
      await interaction.reply({ content: 'Unknown command!', ephemeral: true });
    }
  }
}

// ── Event Handlers ─────────────────────────────────────────────────────────

client.once(Events.ClientReady, (c) => {
  console.log(`\n⚡ ExitStorm Bot is online!`);
  console.log(`   Logged in as: ${c.user.tag}`);
  console.log(`   Serving ${c.guilds.cache.size} guild(s)\n`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    await handleCommand(interaction);
  } catch (err) {
    console.error('Error handling command:', err);
    const msg = 'An error occurred while processing this command.';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: msg, ephemeral: true });
    } else {
      await interaction.reply({ content: msg, ephemeral: true });
    }
  }
});

// ── Start ──────────────────────────────────────────────────────────────────

console.log('🚀 Starting ExitStorm Bot...');
client.login(BOT_TOKEN);
