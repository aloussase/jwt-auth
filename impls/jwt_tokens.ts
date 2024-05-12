import { TokenSymmantics } from "../symmantics";
import { Claims } from "../symmantics/tokens";

import * as T from "fp-ts/Task";
import jwt from "jsonwebtoken"
import * as O from "fp-ts/Option"

export const getJwtTokensSymmantics = (): TokenSymmantics<T.URI> => {
  const PRIVATE_KEY = "some super secret private key"

  const createToken = (claims: Claims) => {
    const payload = { sub: claims.subject }
    return T.fromIO(() => jwt.sign(payload, PRIVATE_KEY, { expiresIn: '15min' }))
  }

  const verifyToken = (token: string): T.Task<O.Option<Claims>> => {
    return () => new Promise((resolve) => {
      try {
        const verified = jwt.verify(token, PRIVATE_KEY) as jwt.JwtPayload
        if (verified.sub) {
          resolve(O.some({ subject: verified.sub }))
        } else {
          resolve(O.none)
        }
      } catch {
        resolve(O.none);
      }
    });
  }

  return {
    createToken,
    verifyToken,
  }
}
