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

  // sessionId/user uniques : aucun vote en attente n'a pu être créé pour cette clé
  // par un test précédent (pendingVotes est un Map partagé au niveau du module).
  const interaction = createMockInteraction({
    customId: "vote:select:q_0:501",
    values: ["3"],
    user: { id: "user-select-test" },
  });

  await assert.doesNotReject(() => handleVoteSelect(interaction));
  assert.match(interaction.lastReply.content, /expirée/);
});

test("handleVoteConfirm refuse si des notes manquent", async () => {
  // Simule un vote en cours en passant d'abord par handleVoteButton.
  setPool(createMockPool([
    [[{ id: 502, product_name: "iPhone 15", questions: ["Design", "Rapidité"] }], []],
    [[], []],
  ]));
  const buttonInteraction = createMockInteraction({ customId: "vote:start:502", user: { id: "user-confirm-test" } });
  await handleVoteButton(buttonInteraction);

  setPool(createMockPool([
    [[{ id: 502, questions: ["Design", "Rapidité"] }], []],
  ]));
  const confirmInteraction = createMockInteraction({ customId: "vote:confirm:502", user: { id: "user-confirm-test" } });

  await assert.doesNotReject(() => handleVoteConfirm(confirmInteraction));
  assert.match(confirmInteraction.lastReply.content, /noter tous les critères/);
});

test("handleVoteComment répond sans planter si la session est terminée", async () => {
  // Simule un vote en cours pour que handleVoteComment dépasse la vérification "recommencez"
  // et atteigne bien la vérification de session terminée.
  setPool(createMockPool([
    [[{ id: 503, product_name: "iPhone 15", questions: ["Design"] }], []],
    [[], []],
  ]));
  const buttonInteraction = createMockInteraction({ customId: "vote:start:503", user: { id: "user-comment-test" } });
  await handleVoteButton(buttonInteraction);

  setPool(createMockPool([[[], []]]));
  const interaction = createMockInteraction({ customId: "vote:comment:503", user: { id: "user-comment-test" } });

  await assert.doesNotReject(() => handleVoteComment(interaction));
  assert.match(interaction.lastReply.content, /terminée/);
});

test("handleVoteComment répond sans planter si aucun vote en attente", async () => {
  setPool(createMockPool());

  const interaction = createMockInteraction({ customId: "vote:comment:504", user: { id: "user-no-pending-test" } });

  await assert.doesNotReject(() => handleVoteComment(interaction));
  assert.match(interaction.lastReply.content, /recommencez/);
});
