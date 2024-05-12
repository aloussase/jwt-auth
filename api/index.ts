import { Kind, URIS } from "fp-ts/HKT";
import { TokenSymmantics, UserSymmantics } from "../symmantics";
import { MonadTask1 } from "fp-ts/MonadTask";
import { pipe } from "fp-ts/lib/function";
import { compare, hash } from "bcryptjs";
import * as O from "fp-ts/Option"
import * as OptionT from "fp-ts/OptionT"
import { User } from "../symmantics/users";
import PaymentSymmantics, { Payment, Quincena } from "../symmantics/payments";

type Program<F extends URIS> = UserSymmantics<F> & TokenSymmantics<F> & PaymentSymmantics<F> & MonadTask1<F>

export const login = <F extends URIS>(F: Program<F>) => (username: string, password: string): Kind<F, O.Option<string>> => {
  return pipe(
    F.getUserByUsername(username),
    OptionT.matchE(F)(
      () => F.of(O.none as O.Option<string>),
      (user) => {
        return F.chain(F.fromTask(() => compare(password, user.password)), ok => {
          const claims = { subject: username }
          return ok ? F.map(F.createToken(claims), O.some) : F.of(O.none as O.Option<string>)
        })
      }
    )
  )
}

export const register = <F extends URIS>(F: Program<F>) => (username: string, password: string): Kind<F, O.Option<User>> => {
  return F.chain(
    F.fromTask(() => hash(password, 10)),
    hashedPassword => F.createUser(username, hashedPassword)
  )
}

export const createQuincena = <F extends URIS>(F: Program<F>) =>
  (username: string, start_date: Date, amount: number): Kind<F, O.Option<Quincena>> => {
    return F.chain(F.getUserByUsername(username), maybeUser => {
      return pipe(
        maybeUser,
        O.match(
          () => F.of(O.none as O.Option<Quincena>),
          ({ id }) => F.createQuincena(id, start_date, amount)
        )
      )
    })
  }

export const getAllQuincenas = <F extends URIS>(F: Program<F>) => (username: string): Kind<F, Quincena[]> => {
  return F.chain(F.getUserByUsername(username), maybeUser => {
    return pipe(
      maybeUser,
      O.match(
        () => F.of([] as Quincena[]),
        (user) => F.getAllQuincenas(user.id)
      )
    )
  })
}

export const createPayment = <F extends URIS>(F: Program<F>) => (
  username: string,
  quincena_id: number,
  description: string,
  amount: number,
): Kind<F, O.Option<Payment>> => {
  // TODO: Check that the quincena belongs to the user.
  return F.createPayment(quincena_id, description, amount)
}

export const getAllPayments = <F extends URIS>(F: Program<F>) => (username: string, quincena_id: number) => {
  // TODO: Check that the quincena belongs to the user.
  return F.getAllPayments(quincena_id);
}

export const fulfillPayment = <F extends URIS>(F: Program<F>) =>
  (username: string, quincena_id: number, payment_id: number): Kind<F, boolean> => {
    // TODO: Check that the payment belongs to the user.
    return F.fulfillPayment(payment_id)
  }
