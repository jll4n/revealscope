// Construit une fausse interaction Discord.js minimale pour les tests.
// Permet d'appeler execute() sans connexion réseau réelle à Discord.
export function createMockInteraction(overrides = {}) {
  const interaction = {
    guild: { id: "guild-1" },
    channel: { id: "channel-1" },
    user: { id: "user-1", username: "testuser" },
    client: { commands: new Map() },
    deferred: false,
    replied: false,
    customId: "",
    values: [],
    fields: { getTextInputValue: () => "" },
    options: {
      getSubcommand: () => undefined,
      getString: () => undefined,
      getChannel: () => undefined,
      getUser: () => undefined,
    },
    reply: async function (payload) {
      this.replied = true;
      this.lastReply = payload;
      return payload;
    },
    editReply: async function (payload) {
      this.lastReply = payload;
      return payload;
    },
    deferReply: async function () {
      this.deferred = true;
    },
    deferUpdate: async function () {
      this.deferred = true;
    },
    showModal: async function (modal) {
      this.lastModal = modal;
      return modal;
    },
    ...overrides,
  };

  return interaction;
}

// Construit un pool MySQL mocké : `responses` est une liste de résultats
// renvoyés successivement par les appels à pool.execute().
export function createMockPool(responses = []) {
  let call = 0;
  return {
    execute: async () => {
      const response = responses[call] ?? [[], []];
      call += 1;
      return response;
    },
  };
}
