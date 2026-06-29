import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export async function loadCommands(commandsPath) {
  const commands = [];

  for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"))) {
    const mod = await import(pathToFileURL(path.join(commandsPath, file)).href);
    if (mod.default?.data?.name) {
      commands.push([mod.default.data.name, mod.default]);
    }
  }

  return commands;
}
