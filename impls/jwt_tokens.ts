import { TokenSymmantics } from "../symmantics";
import { Claims } from "../symmantics/tokens";

import * as T from "fp-ts/Task";
import jwt from "jsonwebtoken"

export const getJwtTokensSymmantics = (): TokenSymmantics<T.URI> => {
  const PRIVATE_KEY = "some super secret private key"

  const createToken = (claims: Claims) => {
    const payload = { sub: claims.subject }
    return T.fromIO(() => jwt.sign(payload, PRIVATE_KEY, { expiresIn: '30s' }))
  }

  const verifyToken = (token: string) => {
    return T.fromIO(() => {
      try {
        jwt.verify(token, PRIVATE_KEY)
        return true;
      } catch {
        return false;
      }
    });
  }

  return {
    createToken,
    verifyToken,
  }
}
