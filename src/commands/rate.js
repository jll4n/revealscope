import { SlashCommandBuilder } from "discord.js";
import { getPool } from "../database/mysql.js";

export default {
  data: new SlashCommandBuilder()
    .setName("rate")
    .setDescription("Noter un utilisateur.")
    .addUserOption((opt) =>
      opt.setName("utilisateur").setDescription("L'utilisateur à noter").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt.setName("note").setDescription("Note de 1 à 10").setMinValue(1).setMaxValue(10).setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("réponses").setDescription("Réponses aux questions séparées par | (ex: réponse1|réponse2)").setRequired(false)
    ),

  async execute(interaction) {
    const pool = getPool();
    const guildId = interaction.guild.id;
    const target = interaction.options.getUser("utilisateur");
    const score = interaction.options.getInteger("note");
    const rawAnswers = interaction.options.getString("réponses") ?? "";

    const [sessionRows] = await pool.execute(
      `SELECT id, questions FROM rating_sessions WHERE guild_id = ? AND active = 1 ORDER BY started_at DESC LIMIT 1`,
      [guildId]
    );

    if (sessionRows.length === 0) {
      return interaction.reply({
        content: "Aucune session de notation active. Un gérant doit utiliser `/session start` pour en lancer une.",
        ephemeral: true
      });
    }

    const session = sessionRows[0];
    const sessionQuestions = JSON.parse(session.questions);

    if (sessionQuestions.length > 0 && !rawAnswers) {
      return interaction.reply({
        content: `Ce questionnaire contient ${sessionQuestions.length} question(s). Remplissez le paramètre **réponses** en séparant par \`|\`.`,
        ephemeral: true
      });
    }

    const answers = rawAnswers ? rawAnswers.split("|").map((a) => a.trim()).filter(Boolean) : [];

    if (sessionQuestions.length > 0 && answers.length !== sessionQuestions.length) {
      return interaction.reply({
        content: `Ce questionnaire attend ${sessionQuestions.length} réponse(s), vous en avez fourni ${answers.length}.`,
        ephemeral: true
      });
    }

    await pool.execute(
      `INSERT INTO ratings (session_id, guild_id, user_id, author_id, score, answers, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [session.id, guildId, target.id, interaction.user.id, score, JSON.stringify(answers)]
    );

    return interaction.reply(
      `${target} a été noté **${score}/10**${answers.length > 0 ? ` avec ${answers.length} réponse(s) enregistrée(s)` : ""}.`
    );
  }
};
