import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getPool } from "../database/mysql.js";

export default {
  data: new SlashCommandBuilder()
    .setName("session")
    .setDescription("Gérer les sessions de notation.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Démarrer une session de notation.")
        .addStringOption((opt) =>
          opt.setName("questions").setDescription("Questions séparées par | (ex: Q1|Q2|Q3)").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("stop").setDescription("Clore la session de notation active.")
    ),

  async execute(interaction) {
    const pool = getPool();
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    if (sub === "start") {
      const raw = interaction.options.getString("questions");
      const questions = raw.split("|").map((q) => q.trim()).filter(Boolean);

      if (questions.length === 0) {
        return interaction.reply({ content: "Aucune question valide fournie.", ephemeral: true });
      }

      const [existing] = await pool.execute(
        `SELECT id FROM rating_sessions WHERE guild_id = ? AND active = 1 LIMIT 1`,
        [guildId]
      );

      if (existing.length > 0) {
        return interaction.reply({
          content: "Une session est déjà active. Utilisez `/session stop` avant d'en démarrer une nouvelle.",
          ephemeral: true
        });
      }

      await pool.execute(
        `INSERT INTO rating_sessions (guild_id, channel_id, opened_by, active, questions, started_at)
         VALUES (?, ?, ?, 1, ?, NOW())`,
        [guildId, interaction.channel.id, interaction.user.id, JSON.stringify(questions)]
      );

      const formatted = questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
      return interaction.reply(
        `Session de notation démarrée avec **${questions.length} question(s)** :\n${formatted}\n\nLes utilisateurs peuvent noter avec \`/rate\`.`
      );
    }

    if (sub === "stop") {
      const [result] = await pool.execute(
        `UPDATE rating_sessions SET active = 0, closed_at = NOW() WHERE guild_id = ? AND active = 1`,
        [guildId]
      );

      if (result.affectedRows === 0) {
        return interaction.reply({ content: "Aucune session active à clore.", ephemeral: true });
      }

      return interaction.reply("Session de notation clôturée.");
    }
  }
};
