import { test } from "node:test";
import assert from "node:assert/strict";
import { setPool } from "../../src/database/mysql.js";
import { handleVoteButton, handleVoteSelect, handleVoteConfirm, handleVoteComment } from "../../src/handlers/vote.js";
import { createMockInteraction, createMockPool } from "../helpers/mockInteraction.js";

test("handleVoteButton ouvre le formulaire de vote sans planter", async () => {
  setPool(createMockPool([
    [[{ id: 42, product_name: "iPhone 15", questions: ["Design"] }], []], // session active
    [[], []], // pas de vote existant
  ]));

  const interaction = createMockInteraction({ customId: "vote:start:42" });

  await assert.doesNotReject(() => handleVoteButton(interaction));
  assert.equal(interaction.replied, true);
});

test("handleVoteButton refuse si session terminée", async () => {
  setPool(createMockPool([[[], []]]));

  const interaction = createMockInteraction({ customId: "vote:start:42" });

  await assert.doesNotReject(() => handleVoteButton(interaction));
  assert.match(interaction.lastReply.content, /terminée/);
});

test("handleVoteSelect répond sans planter même sans vote en cours", async () => {
  setPool(createMockPool());

  const interaction = createMockInteraction({ customId: "vote:select:q_0:42", values: ["3"] });

  await assert.doesNotReject(() => handleVoteSelect(interaction));
  assert.match(interaction.lastReply.content, /expirée/);
});

test("handleVoteConfirm refuse si des notes manquent", async () => {
  setPool(createMockPool([
    [[{ id: 42, questions: ["Design", "Rapidité"] }], []],
  ]));

  // Simule un vote en cours en passant d'abord par handleVoteButton.
  setPool(createMockPool([
    [[{ id: 42, product_name: "iPhone 15", questions: ["Design", "Rapidité"] }], []],
    [[], []],
  ]));
  const buttonInteraction = createMockInteraction({ customId: "vote:start:42", user: { id: "user-1" } });
  await handleVoteButton(buttonInteraction);

  setPool(createMockPool([
    [[{ id: 42, questions: ["Design", "Rapidité"] }], []],
  ]));
  const confirmInteraction = createMockInteraction({ customId: "vote:confirm:42", user: { id: "user-1" } });

  await assert.doesNotReject(() => handleVoteConfirm(confirmInteraction));
  assert.match(confirmInteraction.lastReply.content, /noter tous les critères/);
});

test("handleVoteComment répond sans planter si la session est terminée", async () => {
  setPool(createMockPool([[[], []]]));

  const interaction = createMockInteraction({ customId: "vote:comment:42", user: { id: "user-1" } });

  await assert.doesNotReject(() => handleVoteComment(interaction));
  assert.match(interaction.lastReply.content, /recommencez/);
});
