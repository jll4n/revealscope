import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getPool } from "../database/mysql.js";

export default {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Afficher les notes globales ou d'un utilisateur.")
    .addUserOption((opt) =>
      opt.setName("utilisateur").setDescription("Voir les notes d'un utilisateur précis").setRequired(false)
    ),

  async execute(interaction) {
    const pool = getPool();
    const guildId = interaction.guild.id;
    const target = interaction.options.getUser("utilisateur");

    await interaction.deferReply();

    if (target) {
      const [rows] = await pool.execute(
        `SELECT AVG(score) AS average_score, COUNT(*) AS count FROM ratings WHERE guild_id = ? AND user_id = ?`,
        [guildId, target.id]
      );

      const { average_score, count } = rows[0];
      if (count === 0) {
        return interaction.editReply(`Aucune note trouvée pour ${target}.`);
      }

      const embed = new EmbedBuilder()
        .setTitle(`Notes de ${target.username}`)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: "Moyenne", value: `**${Number(average_score).toFixed(2)}/10**`, inline: true },
          { name: "Nombre de notes", value: `${count}`, inline: true }
        )
        .setColor(0x5865f2);

      return interaction.editReply({ embeds: [embed] });
    }

    const [globalRows] = await pool.execute(
      `SELECT AVG(score) AS average_score, COUNT(*) AS count FROM ratings WHERE guild_id = ?`,
      [guildId]
    );

    const { average_score, count } = globalRows[0];
    if (count === 0) {
      return interaction.editReply("Aucune note enregistrée dans ce serveur.");
    }

    const [topRows] = await pool.execute(
      `SELECT user_id, AVG(score) AS average_score, COUNT(*) AS count
       FROM ratings WHERE guild_id = ?
       GROUP BY user_id
       ORDER BY average_score DESC, count DESC
       LIMIT 5`,
      [guildId]
    );

    const topList = topRows
      .map((row, i) => `${i + 1}. <@${row.user_id}> — **${Number(row.average_score).toFixed(2)}/10** (${row.count} note(s))`)
      .join("\n");

    const embed = new EmbedBuilder()
      .setTitle("Classement du serveur")
      .addFields(
        { name: "Moyenne globale", value: `**${Number(average_score).toFixed(2)}/10** (${count} note(s))`, inline: false },
        { name: "Top utilisateurs", value: topList || "Aucun", inline: false }
      )
      .setColor(0x5865f2);

    return interaction.editReply({ embeds: [embed] });
  }
};
