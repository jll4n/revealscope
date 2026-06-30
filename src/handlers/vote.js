import {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags
} from "discord.js";
import { getPool } from "../database/mysql.js";

const starOptions = [
  { label: "⭐ 1 étoile", value: "1" },
  { label: "⭐⭐ 2 étoiles", value: "2" },
  { label: "⭐⭐⭐ 3 étoiles", value: "3" },
  { label: "⭐⭐⭐⭐ 4 étoiles", value: "4" },
  { label: "⭐⭐⭐⭐⭐ 5 étoiles", value: "5" },
];

// In-memory store: `${userId}:${sessionId}` -> { scores: { q_0: 3, overall: 5 } }
const pendingVotes = new Map();

export async function handleVoteButton(interaction) {
  const sessionId = interaction.customId.split(":")[2];
  const pool = getPool();

  const [sessionRows] = await pool.execute(
    `SELECT id, product_name, questions FROM rating_sessions WHERE id = ? AND active = 1 LIMIT 1`,
    [sessionId]
  );

  if (sessionRows.length === 0) {
    return interaction.reply({ content: "Cette session de vote est terminée.", flags: MessageFlags.Ephemeral });
  }

  const [existing] = await pool.execute(
    `SELECT id FROM ratings WHERE session_id = ? AND author_id = ? LIMIT 1`,
    [sessionId, interaction.user.id]
  );

  if (existing.length > 0) {
    return interaction.reply({ content: "Vous avez déjà voté pour cette session.", flags: MessageFlags.Ephemeral });
  }

  const session = sessionRows[0];
  const questions = session.questions;

  pendingVotes.set(`${interaction.user.id}:${sessionId}`, { scores: {} });

  const rows = questions.map((question, i) =>
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`vote:select:q_${i}:${sessionId}`)
        .setPlaceholder(question)
        .addOptions(starOptions)
    )
  );

  rows.push(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`vote:select:overall:${sessionId}`)
        .setPlaceholder("Note générale")
        .addOptions(starOptions)
    )
  );

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`vote:confirm:${sessionId}`)
        .setLabel("Valider")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✅")
    )
  );

  return interaction.reply({
    content: `**Vote — ${session.product_name}**\nSélectionnez votre note pour chaque critère, puis cliquez sur **Valider**.`,
    components: rows,
    flags: MessageFlags.Ephemeral
  });
}

export async function handleVoteSelect(interaction) {
  const parts = interaction.customId.split(":");
  const field = parts[2];
  const sessionId = parts[3];
  const key = `${interaction.user.id}:${sessionId}`;

  const pending = pendingVotes.get(key);
  if (!pending) {
    return interaction.reply({ content: "Session expirée, cliquez à nouveau sur Voter.", flags: MessageFlags.Ephemeral });
  }

  pending.scores[field] = Number(interaction.values[0]);
  return interaction.deferUpdate();
}

export async function handleVoteConfirm(interaction) {
  const sessionId = interaction.customId.split(":")[2];
  const key = `${interaction.user.id}:${sessionId}`;
  const pool = getPool();

  const pending = pendingVotes.get(key);
  if (!pending) {
    return interaction.reply({ content: "Session expirée, cliquez à nouveau sur Voter.", flags: MessageFlags.Ephemeral });
  }

  const [sessionRows] = await pool.execute(
    `SELECT id, questions FROM rating_sessions WHERE id = ? AND active = 1 LIMIT 1`,
    [sessionId]
  );

  if (sessionRows.length === 0) {
    pendingVotes.delete(key);
    return interaction.reply({ content: "Cette session de vote est terminée.", flags: MessageFlags.Ephemeral });
  }

  const questions = sessionRows[0].questions;
  const missingQuestions = questions.some((_, i) => pending.scores[`q_${i}`] === undefined);
  const missingOverall = pending.scores.overall === undefined;

  if (missingQuestions || missingOverall) {
    return interaction.reply({ content: "Veuillez noter tous les critères avant de valider.", flags: MessageFlags.Ephemeral });
  }

  const modal = new ModalBuilder()
    .setCustomId(`vote:comment:${sessionId}`)
    .setTitle("Commentaire (optionnel)")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("comment")
          .setLabel("Partagez votre avis")
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("Votre commentaire en quelques mots...")
          .setMaxLength(500)
          .setRequired(false)
      )
    );

  return interaction.showModal(modal);
}

export async function handleVoteComment(interaction) {
  const sessionId = interaction.customId.split(":")[2];
  const key = `${interaction.user.id}:${sessionId}`;
  const pool = getPool();

  const pending = pendingVotes.get(key);
  if (!pending) {
    return interaction.reply({ content: "Session expirée, recommencez le vote.", flags: MessageFlags.Ephemeral });
  }

  const [sessionRows] = await pool.execute(
    `SELECT id, guild_id, product_name, questions FROM rating_sessions WHERE id = ? AND active = 1 LIMIT 1`,
    [sessionId]
  );

  if (sessionRows.length === 0) {
    pendingVotes.delete(key);
    return interaction.reply({ content: "Cette session de vote est terminée.", flags: MessageFlags.Ephemeral });
  }

  const [existing] = await pool.execute(
    `SELECT id FROM ratings WHERE session_id = ? AND author_id = ? LIMIT 1`,
    [sessionId, interaction.user.id]
  );

  if (existing.length > 0) {
    pendingVotes.delete(key);
    return interaction.reply({ content: "Vous avez déjà voté pour cette session.", flags: MessageFlags.Ephemeral });
  }

  const session = sessionRows[0];
  const questions = session.questions;
  const questionScores = questions.map((_, i) => pending.scores[`q_${i}`]);
  const overallScore = pending.scores.overall;
  const comment = interaction.fields.getTextInputValue("comment").trim() || null;

  await pool.execute(
    `INSERT INTO ratings (session_id, guild_id, user_id, author_id, score, answers, comment, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [sessionId, session.guild_id, null, interaction.user.id, overallScore, JSON.stringify(questionScores), comment]
  );

  pendingVotes.delete(key);
  return interaction.reply({ content: `Vote enregistré — merci pour votre avis sur **${session.product_name}** !`, flags: MessageFlags.Ephemeral });
}
