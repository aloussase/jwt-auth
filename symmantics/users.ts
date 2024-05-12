import { Kind, URIS } from "fp-ts/HKT";
import { Option } from "fp-ts/lib/Option";

export interface User {
  id: number,
  username: string,
  password: string,
}

export default interface UserSymmantics<F extends URIS> {
  /**
   * Create a new user.
   */
  readonly createUser: (username: string, password: string) => Kind<F, Option<User>>;

  /**
   * Get a user by their username.
   */
  readonly getUserByUsername: (username: string) => Kind<F, Option<User>>;
}
