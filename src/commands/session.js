import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from "discord.js";
import { getPool } from "../database/mysql.js";

export default {
  data: new SlashCommandBuilder()
    .setName("session")
    .setDescription("Gérer les sessions de vote.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Démarrer une session de vote.")
        .addStringOption((opt) =>
          opt.setName("produit").setDescription("Nom du produit ou service à noter").setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("questions")
            .setDescription("Questions séparées par | — max 4 (ex: Note le design|Note la rapidité)")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("stop").setDescription("Clore la session de vote active.")
    ),

  async execute(interaction) {
    const allowedUserIds = (process.env.ALLOWED_USER_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (allowedUserIds.length > 0 && !allowedUserIds.includes(interaction.user.id)) {
      return interaction.reply({
        content: "Vous n'êtes pas autorisé à utiliser cette commande.",
        flags: MessageFlags.Ephemeral
      });
    }

    const pool = getPool();
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    if (sub === "start") {
      const productName = interaction.options.getString("produit").trim();
      const raw = interaction.options.getString("questions");
      const questions = raw.split("|").map((q) => q.trim()).filter(Boolean);

      if (questions.length === 0) {
        return interaction.reply({ content: "Aucune question valide fournie.", flags: MessageFlags.Ephemeral });
      }

      if (questions.length > 3) {
        return interaction.reply({
          content: "Maximum **3 questions** par session (le formulaire Discord inclut aussi une note générale et un champ commentaire).",
          flags: MessageFlags.Ephemeral
        });
      }

      const [existing] = await pool.execute(
        `SELECT id FROM rating_sessions WHERE guild_id = ? AND channel_id = ? AND active = 1 LIMIT 1`,
        [guildId, interaction.channel.id]
      );

      if (existing.length > 0) {
        return interaction.reply({
          content: "Un vote est déjà en cours dans ce canal. Utilisez `/session stop` pour le clore, ou lancez un nouveau vote dans un autre canal.",
          flags: MessageFlags.Ephemeral
        });
      }

      const [result] = await pool.execute(
        `INSERT INTO rating_sessions (guild_id, channel_id, opened_by, active, product_name, questions, started_at)
         VALUES (?, ?, ?, 1, ?, ?, NOW())`,
        [guildId, interaction.channel.id, interaction.user.id, productName, JSON.stringify(questions)]
      );

      const sessionId = result.insertId;

      const embed = new EmbedBuilder()
        .setTitle(`Vote — ${productName}`)
        .setDescription(
          questions.map((q, i) => `**${i + 1}.** ${q}`).join("\n") +
          "\n\n**Note générale**\n\nNotation de ⭐ à ⭐⭐⭐⭐⭐"
        )
        .setColor(0x5865f2)
        .setFooter({ text: `Session #${sessionId} • Lancée par ${interaction.user.username}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`vote:start:${sessionId}`)
          .setLabel("Voter")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("🗳️")
      );

      return interaction.reply({ embeds: [embed], components: [row] });
    }

    if (sub === "stop") {
      const [result] = await pool.execute(
        `UPDATE rating_sessions SET active = 0, closed_at = NOW() WHERE guild_id = ? AND channel_id = ? AND active = 1`,
        [guildId, interaction.channel.id]
      );

      if (result.affectedRows === 0) {
        return interaction.reply({ content: "Aucun vote actif dans ce canal.", flags: MessageFlags.Ephemeral });
      }

      return interaction.reply("Session de vote clôturée.");
    }
  }
};
