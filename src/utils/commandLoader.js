import fs from "fs";
import path from "path";

export async function loadCommands(commandsPath) {
  const commands = new Map();

  for (const file of fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"))) {
    const command = await import(path.join(commandsPath, file));
    if (command.default && command.default.name) {
      commands.set(command.default.name, command.default);
    }
  }

  return commands;
}
