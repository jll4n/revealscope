export default {
  name: "clientReady",
  once: true,
  execute(client) {
    console.log(`Bot prêt : ${client.user.tag}`);
  }
};
