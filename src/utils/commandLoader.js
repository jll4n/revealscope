import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export async function loadCommands(commandsPath) {
  const commands = new Map();

  for (const file of fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"))) {
    const command = await import(pathToFileURL(path.join(commandsPath, file)).href);
    if (command.default && command.default.name) {
      commands.set(command.default.name, command.default);
    }
  }

  return commands;
}
