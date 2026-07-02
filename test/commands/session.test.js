import { test } from "node:test";
import assert from "node:assert/strict";
import { setPool } from "../../src/database/mysql.js";
import sessionCommand from "../../src/commands/session.js";
import { createMockInteraction, createMockPool } from "../helpers/mockInteraction.js";

test("/session start crée une session et répond sans planter", async () => {
  setPool(createMockPool([
    [[], []], // SELECT existing -> aucune session active
    [{ insertId: 42 }, []], // INSERT
  ]));

  const interaction = createMockInteraction({
    options: {
      getSubcommand: () => "start",
      getString: (name) => (name === "produit" ? "iPhone 15" : "Note le design|Note la rapidité"),
    },
  });

  await assert.doesNotReject(() => sessionCommand.execute(interaction));
  assert.equal(interaction.replied, true);
  assert.ok(interaction.lastReply.embeds, "une réponse avec embed est attendue");
});

test("/session start refuse plus de 3 questions sans planter", async () => {
  setPool(createMockPool());

  const interaction = createMockInteraction({
    options: {
      getSubcommand: () => "start",
      getString: (name) => (name === "produit" ? "iPhone 15" : "Q1|Q2|Q3|Q4"),
    },
  });

  await assert.doesNotReject(() => sessionCommand.execute(interaction));
  assert.match(interaction.lastReply.content, /Maximum/);
});

test("/session stop sans session active répond proprement", async () => {
  setPool(createMockPool([
    [{ affectedRows: 0 }, []],
  ]));

  const interaction = createMockInteraction({
    options: { getSubcommand: () => "stop" },
  });

  await assert.doesNotReject(() => sessionCommand.execute(interaction));
  assert.match(interaction.lastReply.content, /Aucun vote actif/);
});

test("/session stop avec session active répond proprement", async () => {
  setPool(createMockPool([
    [{ affectedRows: 1 }, []],
  ]));

  const interaction = createMockInteraction({
    options: { getSubcommand: () => "stop" },
  });

  await assert.doesNotReject(() => sessionCommand.execute(interaction));
  assert.equal(interaction.lastReply, "Session de vote clôturée.");
});
