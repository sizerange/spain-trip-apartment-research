import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const apartmentPairPublicationsTable = pgTable(
  "apartment_pair_publications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reviewedAt: text("reviewed_at").notNull(),
    disclaimer: text("disclaimer").notNull(),
    pairs: jsonb("pairs").$type<unknown[]>().notNull(),
    budgetExceptions: jsonb("budget_exceptions").$type<unknown[]>().notNull(),
    source: text("source").notNull().default("chatgpt-import"),
    active: boolean("active").notNull().default(true),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export const insertApartmentPairPublicationSchema = createInsertSchema(
  apartmentPairPublicationsTable,
).omit({
  id: true,
  importedAt: true,
});

export type InsertApartmentPairPublication = z.infer<
  typeof insertApartmentPairPublicationSchema
>;
export type ApartmentPairPublication =
  typeof apartmentPairPublicationsTable.$inferSelect;