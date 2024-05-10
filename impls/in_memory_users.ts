import { UserSymmantics } from "../symmantics";

import * as T from "fp-ts/Task";
import * as O from "fp-ts/Option";
import { User } from "../symmantics/users";


export const getInMemoryUsers = (): UserSymmantics<T.URI> => {
  const db = new Map<number, User>();
  const nextId = () => db.size + 1;

  const createUser = (username: string, password: string) => {
    const id = nextId();
    const user = { username, password, id } as User
    db.set(id, user);
    return T.of(
      O.some(user),
    )
  }

  const getUserByUsername = (username: string) => {
    for (let user of db.values()) {
      if (user.username === username) {
        return T.of(O.some(user))
      }
    }
    return T.of(O.none)
  }

  return {
    createUser,
    getUserByUsername,
  }
}
