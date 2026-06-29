import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { connectDatabase } from "./database/mysql.js";
import { loadCommands } from "./utils/commandLoader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsPath = path.join(__dirname, "commands");
const eventsPath = path.join(__dirname, "events");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

client.commands = new Collection(await loadCommands(commandsPath));

for (const file of fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"))) {
  const event = await import(path.join(eventsPath, file));
  if (!event.default || !event.default.name) continue;

  if (event.default.once) {
    client.once(event.default.name, (...args) => event.default.execute(...args));
  } else {
    client.on(event.default.name, (...args) => event.default.execute(...args));
  }
}

connectDatabase()
  .then(() => client.login(process.env.DISCORD_TOKEN))
  .catch((error) => {
    console.error("Impossible de démarrer le bot :", error);
    process.exit(1);
  });
