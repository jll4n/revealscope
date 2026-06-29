export default {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`Bot prêt : ${client.user.tag}`);
  }
};
