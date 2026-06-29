import { getPool } from "../database/mysql.js";

export default {
  name: "rate",
  description: "Noter un utilisateur avec questionnaire.",
  async execute({ message, args }) {
    const target = message.mentions.users.first();
    const score = Number(args[1]);
    const pool = getPool();
    const guildId = message.guild.id;

    if (!target) {
      return message.reply("Veuillez mentionner un utilisateur à noter.");
    }

    if (Number.isNaN(score) || score < 1 || score > 10) {
      return message.reply("Veuillez fournir une note entre 1 et 10.");
    }

    const [sessionRows] = await pool.execute(
      `SELECT id, questions FROM rating_sessions WHERE guild_id = ? AND active = 1 ORDER BY started_at DESC LIMIT 1`,
      [guildId]
    );

    if (sessionRows.length === 0) {
      return message.reply(
        "Aucune session de notation active. Un gérant doit utiliser `!session start question1|question2|...` pour lancer une session."
      );
    }

    const session = sessionRows[0];
    const rawAnswers = args.slice(2).join(" ").trim();
    if (!rawAnswers) {
      return message.reply(
        "Veuillez fournir les réponses au questionnaire séparées par `|`. Exemple : `!rate @user 8 réponse1|réponse2`."
      );
    }

    const answers = rawAnswers.split("|").map((answer) => answer.trim()).filter(Boolean);
    const sessionQuestions = JSON.parse(session.questions);

    if (answers.length !== sessionQuestions.length) {
      return message.reply(
        `Ce questionnaire attend ${sessionQuestions.length} réponse(s). Vous avez envoyé ${answers.length}.`
      );
    }

    await pool.execute(
      `INSERT INTO ratings (session_id, guild_id, user_id, author_id, score, answers, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [session.id, guildId, target.id, message.author.id, score, JSON.stringify(answers)]
    );

    return message.reply(
      `${target.tag} a été noté ${score}/10 avec ${answers.length} réponse(s) enregistrée(s).`
    );
  }
};
