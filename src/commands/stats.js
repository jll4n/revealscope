import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { getPool } from "../database/mysql.js";

export default {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Afficher les résultats détaillés d'un vote par canal.")
    .addChannelOption((opt) =>
      opt.setName("canal").setDescription("Le canal dont vous voulez voir les résultats").setRequired(true)
    ),

  async execute(interaction) {
    const pool = getPool();
    const guildId = interaction.guild.id;
    const channel = interaction.options.getChannel("canal");

    await interaction.deferReply();

    const [sessionRows] = await pool.execute(
      `SELECT id, product_name, questions, active, started_at, closed_at
       FROM rating_sessions
       WHERE guild_id = ? AND channel_id = ?
       ORDER BY started_at DESC
       LIMIT 1`,
      [guildId, channel.id]
    );

    if (sessionRows.length === 0) {
      return interaction.editReply({ content: `Aucune session de vote trouvée dans ${channel}.`, flags: MessageFlags.Ephemeral });
    }

    const session = sessionRows[0];
    const questions = session.questions;
    const status = session.active ? "🟢 En cours" : "🔴 Clôturée";
    const startedAt = new Date(session.started_at).toLocaleString("fr-FR");

    const [voteRows] = await pool.execute(
      `SELECT author_id, score, answers, comment FROM ratings WHERE session_id = ? ORDER BY created_at ASC`,
      [session.id]
    );

    if (voteRows.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle(`📊 ${session.product_name}`)
        .setDescription(`${status} • Démarré le ${startedAt}\n\nAucun vote enregistré pour l'instant.`)
        .setColor(0x5865f2);
      return interaction.editReply({ embeds: [embed] });
    }

    const avgOverall = voteRows.reduce((sum, r) => sum + r.score, 0) / voteRows.length;

    const avgPerQuestion = questions.map((_, i) => {
      const total = voteRows.reduce((sum, r) => sum + (r.answers?.[i] ?? 0), 0);
      return (total / voteRows.length).toFixed(1);
    });

    const questionsSummary = questions
      .map((q, i) => `**${i + 1}.** ${q} — **${avgPerQuestion[i]}/5**`)
      .join("\n");

    const votesDetail = voteRows.map((vote) => {
      const scoresLine = vote.answers
        ? vote.answers.map((s, i) => `Q${i + 1}: ${s}/5`).join(" • ")
        : "";
      const commentLine = vote.comment ? `\n> 💬 ${vote.comment}` : "";
      return `<@${vote.author_id}> — note générale **${vote.score}/5**${scoresLine ? `\n${scoresLine}` : ""}${commentLine}`;
    });

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${session.product_name}`)
      .setColor(0x5865f2)
      .setFooter({ text: `${voteRows.length} vote(s) • Démarré le ${startedAt}` });

    embed.addFields({ name: `${status} — Moyennes`, value: questionsSummary + `\n**Note générale : ${avgOverall.toFixed(2)}/5**`, inline: false });

    const MAX_CHARS = 1000;
    let detail = votesDetail.join("\n\n");
    if (detail.length > MAX_CHARS) {
      detail = detail.slice(0, MAX_CHARS) + "\n*(tronqué — trop de votes)*";
    }

    embed.addFields({ name: "Votes détaillés", value: detail, inline: false });

    return interaction.editReply({ embeds: [embed] });
  }
};
