export default {
  name: "messageCreate",
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const prefix = process.env.PREFIX || "!";
    if (!message.content.startsWith(prefix)) return;

    const [commandName, ...args] = message.content.slice(prefix.length).trim().split(/\s+/);
    const lowerCommand = commandName.toLowerCase();
    const command =
      message.client.commands.get(lowerCommand) ||
      message.client.commands.find((cmd) => cmd.aliases?.includes(lowerCommand));

    if (!command) return;

    try {
      await command.execute({ message, args, client: message.client });
    } catch (error) {
      console.error(error);
      await message.reply("Une erreur est survenue lors de l'exécution de la commande.");
    }
  }
};
