import { Kind, URIS } from "fp-ts/HKT";
import { TokenSymmantics, UserSymmantics } from "../symmantics";
import { MonadTask1 } from "fp-ts/MonadTask";
import { pipe } from "fp-ts/lib/function";
import { compare, hash } from "bcryptjs";
import * as O from "fp-ts/Option"
import * as OptionT from "fp-ts/OptionT"
import { User } from "../symmantics/users";

type Program<F extends URIS> = UserSymmantics<F> & TokenSymmantics<F> & MonadTask1<F>

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
