import { pipe } from "fp-ts/lib/function";
import { Database, users } from "../db/schemas";
import { UserSymmantics } from "../symmantics";
import * as T from "fp-ts/Task"
import * as O from "fp-ts/Option"
import { User } from "../symmantics/users";
import { eq } from "drizzle-orm";


export const getDrizzleUsers = (db: Database): UserSymmantics<T.URI> => {
  const createUser = (username: string, password: string): T.Task<O.Option<User>> => {
    return pipe(
      () => db.insert(users).values({ username, password }).returning(),
      T.map((users: User[]) => {
        if (users.length > 0) return O.some(users[0])
        return O.none
      }),
    )
  }

  const getUserByUsername = (username: string): T.Task<O.Option<User>> => {
    return pipe(
      () => db.select().from(users).where(eq(users.username, username)),
      T.map((users) => {
        if (users.length > 0) return O.some(users[0]);
        return O.none;
      })
    )
  }

  return {
    createUser,
    getUserByUsername,
  }
}
