import { Database, payments, quincenas } from "../db/schemas";
import PaymentSymmantics, { Payment, Quincena } from "../symmantics/payments";
import * as T from 'fp-ts/Task'
import * as O from 'fp-ts/Option'
import { pipe } from "fp-ts/lib/function";
import { eq } from "drizzle-orm";
import * as TO from "fp-ts/TaskOption";

export const getDrizzlePayments = (db: Database): PaymentSymmantics<T.URI> => {
  const createQuincena = (user_id: number, start_date: Date, available: number): T.Task<O.Option<Quincena>> => {
    return pipe(
      () => db.insert(quincenas).values({ user_id, start_date, available: available.toString() }).returning(),
      T.map(quincenas => quincenas.length > 0 ? O.some(quincenas[0]) : O.none),
      TO.map(({ available, ...rest }) => ({ available: parseFloat(available), ...rest }))
    )
  }

  const getAllQuincenas = (user_id: number): T.Task<Quincena[]> => {
    return () => db.query
      .quincenas
      .findMany({ where: eq(quincenas.user_id, user_id) })
      .then(quincenas => quincenas.map(({ available, ...rest }) => ({ available: parseFloat(available), ...rest })))
  }

  const createPayment = (quincena_id: number, description: string, amount: number): T.Task<O.Option<Payment>> => {
    return pipe(
      () => db.insert(payments).values({ quincena_id, description, amount: amount.toString() }).returning(),
      T.map(payments => payments.length > 0 ? O.some(payments[0]) : O.none),
      TO.map(({ amount, ...rest }) => ({ amount: parseFloat(amount), ...rest })),
    )
  }

  const fulfillPayment = (payment_id: number): T.Task<boolean> => {
    return pipe(
      () => db.update(payments).set({ fulfilled: true }).where(eq(payments.id, payment_id)),
      T.apSecond(T.of(true)),
    );
  }

  return {
    createQuincena,
    getAllQuincenas,
    createPayment,
    fulfillPayment,
  }
}

