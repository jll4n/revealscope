import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Client, GatewayIntentBits, Partials, Collection, REST, Routes } from "discord.js";
import { connectDatabase } from "./database/mysql.js";
import { loadCommands } from "./utils/commandLoader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsPath = path.join(__dirname, "commands");
const eventsPath = path.join(__dirname, "events");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

const commands = await loadCommands(commandsPath);
client.commands = new Collection(commands);

for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith(".js"))) {
  const event = await import(pathToFileURL(path.join(eventsPath, file)).href);
  if (!event.default?.name) continue;

  if (event.default.once) {
    client.once(event.default.name, (...args) => event.default.execute(...args));
  } else {
    client.on(event.default.name, (...args) => event.default.execute(...args));
  }
}

async function registerSlashCommands() {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  const body = commands.map(([, cmd]) => cmd.data.toJSON());
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
    console.log(`Slash commands enregistrées sur le serveur ${guildId}`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body });
    console.log("Slash commands enregistrées globalement (peut prendre jusqu'à 1h)");
  }
}

connectDatabase()
  .then(() => registerSlashCommands())
  .then(() => client.login(process.env.DISCORD_TOKEN))
  .catch((error) => {
    console.error("Impossible de démarrer le bot :", error);
    process.exit(1);
  });
