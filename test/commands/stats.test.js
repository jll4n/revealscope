import { test } from "node:test";
import assert from "node:assert/strict";
import { setPool } from "../../src/database/mysql.js";
import statsCommand from "../../src/commands/stats.js";
import { createMockInteraction, createMockPool } from "../helpers/mockInteraction.js";

test("/stats sans session trouvée répond sans planter", async () => {
  setPool(createMockPool([
    [[], []], // aucune session pour ce canal
  ]));

  const interaction = createMockInteraction({
    options: { getChannel: () => ({ id: "channel-1", toString: () => "#general" }) },
  });

  await assert.doesNotReject(() => statsCommand.execute(interaction));
  assert.match(interaction.lastReply.content, /Aucune session/);
});

test("/stats avec session mais aucun vote répond sans planter", async () => {
  setPool(createMockPool([
    [[{ id: 1, product_name: "iPhone 15", questions: ["Design"], active: 1, started_at: new Date() }], []],
    [[], []], // aucun vote
  ]));

  const interaction = createMockInteraction({
    options: { getChannel: () => ({ id: "channel-1", toString: () => "#general" }) },
  });

  await assert.doesNotReject(() => statsCommand.execute(interaction));
  assert.ok(interaction.lastReply.embeds);
});

test("/stats avec votes calcule les moyennes sans planter", async () => {
  setPool(createMockPool([
    [[{ id: 1, product_name: "iPhone 15", questions: ["Design", "Rapidité"], active: 0, started_at: new Date() }], []],
    [[
      { author_id: "user-1", score: 4, answers: [4, 5], comment: "Top" },
      { author_id: "user-2", score: 3, answers: [3, 4], comment: null },
    ], []],
  ]));

  const interaction = createMockInteraction({
    options: { getChannel: () => ({ id: "channel-1", toString: () => "#general" }) },
  });

  await assert.doesNotReject(() => statsCommand.execute(interaction));
  assert.ok(interaction.lastReply.embeds);
});
