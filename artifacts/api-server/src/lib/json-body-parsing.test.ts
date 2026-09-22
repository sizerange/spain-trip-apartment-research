import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
// @ts-ignore Node's type stripping uses the source extension in tests.
import { configureJsonBodyParsing } from "./json-body-parsing.ts";

test("large publications reach the import handler; other routes and oversized imports stay bounded", async () => {
  const app = express();
  app.set("env", "test");
  configureJsonBodyParsing(app);
  app.post(["/api/apartment-pairs/import", "/other"], (req, res) => {
    res.json({ length: req.body.data.length });
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const send = (path: string, size: number) => fetch(`http://127.0.0.1:${address.port}${path}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: "a".repeat(size) }),
    });
    const accepted = await send("/api/apartment-pairs/import", 160_000);
    assert.equal(accepted.status, 200);
    assert.equal((await accepted.json()).length, 160_000);
    assert.equal((await send("/other", 160_000)).status, 413);
    assert.equal((await send("/api/apartment-pairs/import", 2 * 1024 * 1024)).status, 413);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
