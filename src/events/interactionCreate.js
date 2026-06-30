import { MessageFlags } from "discord.js";
import { handleVoteButton, handleVoteSelect, handleVoteConfirm, handleVoteComment } from "../handlers/vote.js";

export default {
  name: "interactionCreate",
  async execute(interaction) {
    try {
      if (interaction.isButton() && interaction.customId.startsWith("vote:start:")) {
        return await handleVoteButton(interaction);
      }

      if (interaction.isStringSelectMenu() && interaction.customId.startsWith("vote:select:")) {
        return await handleVoteSelect(interaction);
      }

      if (interaction.isButton() && interaction.customId.startsWith("vote:confirm:")) {
        return await handleVoteConfirm(interaction);
      }

      if (interaction.isModalSubmit() && interaction.customId.startsWith("vote:comment:")) {
        return await handleVoteComment(interaction);
      }

      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        return await command.execute(interaction);
      }
    } catch (error) {
      console.error(error);
      const msg = { content: "Une erreur est survenue.", flags: MessageFlags.Ephemeral };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  }
};
