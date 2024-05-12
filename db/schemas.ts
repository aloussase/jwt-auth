import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { boolean, date, decimal, integer, serial, text } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  password: text('password').notNull(),
})

export const quincenas = pgTable("quincenas", {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  start_date: date('start_date', { mode: 'date' }).notNull(),
  available: decimal('available').notNull(),
})

export const payments = pgTable("payments", {
  id: serial('id').primaryKey(),
  quincena_id: integer('quincena_id').notNull().references(() => quincenas.id),
  description: text('description').notNull(),
  amount: decimal('amount').notNull(),
  fulfilled: boolean('fulfilled').notNull().default(false),
});

export type Schema = { users: typeof users, payments: typeof payments, quincenas: typeof quincenas }
export type Database = NodePgDatabase<Schema>
