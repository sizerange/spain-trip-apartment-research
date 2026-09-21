import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const apartmentCandidatesTable = pgTable("apartment_candidates", {
  listingId: text("listing_id").primaryKey(),
  listing: jsonb("listing").$type<unknown>().notNull(),
  source: text("source").notNull().default("chatgpt-import"),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertApartmentCandidateSchema = createInsertSchema(
  apartmentCandidatesTable,
).omit({
  savedAt: true,
});

export type InsertApartmentCandidate = z.infer<
  typeof insertApartmentCandidateSchema
>;
export type ApartmentCandidate = typeof apartmentCandidatesTable.$inferSelect;