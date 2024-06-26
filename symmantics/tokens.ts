import { Kind, URIS } from "fp-ts/HKT";
import * as O from "fp-ts/Option"

export interface Claims {
  subject: string,
}

export default interface TokenSymmantics<F extends URIS> {
  /**
   * Create a token using the provided claims.
   */
  readonly createToken: (claims: Claims) => Kind<F, string>

  /**
   * Check the validity of the provided token.
   */
  readonly verifyToken: (token: string) => Kind<F, O.Option<Claims>>
}
