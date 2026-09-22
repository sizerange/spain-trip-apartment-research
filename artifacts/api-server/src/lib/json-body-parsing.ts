import express, { type Express } from "express";

export function configureJsonBodyParsing(app: Express): void {
  // Complete research files can exceed the default 100 KiB JSON limit.
  // Other routes retain their existing limit; authorization is unchanged.
  app.post("/api/apartment-pairs/import", express.json({ limit: "2mb" }));
  app.use(express.json());
}
