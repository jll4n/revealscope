import { getPool } from "../database/mysql.js";

export default {
  name: "stats",
  description: "Afficher les notes globales ou d'un utilisateur.",
  aliases: ["ranking"],
  async execute({ message, args }) {
    const target = message.mentions.users.first();
    const pool = getPool();
    const guildId = message.guild.id;

    if (target) {
      const [rows] = await pool.execute(
        `SELECT AVG(score) AS average_score, COUNT(*) AS count
         FROM ratings
         WHERE guild_id = ? AND user_id = ?`,
        [guildId, target.id]
      );

      const { average_score, count } = rows[0];
      if (count === 0) {
        return message.reply(`Aucune note trouvée pour ${target.tag}.`);
      }

      return message.reply(
        `${target.tag} : moyenne ${Number(average_score).toFixed(2)}/10 sur ${count} note(s).`
      );
    }

    const [rows] = await pool.execute(
      `SELECT AVG(score) AS average_score, COUNT(*) AS count
       FROM ratings
       WHERE guild_id = ?`,
      [guildId]
    );

    const { average_score, count } = rows[0];
    if (count === 0) {
      return message.reply("Aucune note enregistrée dans ce serveur.");
    }

    const [topRows] = await pool.execute(
      `SELECT user_id, AVG(score) AS average_score, COUNT(*) AS count
       FROM ratings
       WHERE guild_id = ?
       GROUP BY user_id
       ORDER BY average_score DESC, count DESC
       LIMIT 5`,
      [guildId]
    );

    const topList = topRows
      .map(
        (row, index) =>
          `${index + 1}. <@${row.user_id}> — ${Number(row.average_score).toFixed(2)}/10 (${row.count} note(s))`
      )
      .join("\n");

    return message.reply(
      `Note moyenne du serveur : ${Number(average_score).toFixed(2)}/10 (${count} note(s)).\n\nTop utilisateurs :\n${topList}`
    );
  }
};
