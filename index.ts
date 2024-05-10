import express from "express"
import type { RequestHandler } from "express";
import * as T from "fp-ts/Task"

import { getJwtTokensSymmantics } from "./impls";
import { pipe } from "fp-ts/lib/function";

const app = express();

app.get("/healthcheck", (_, res) => res.json("OK"))

const TOKENS = getJwtTokensSymmantics();

const verifyAccessTokenMiddleware: RequestHandler = (req, res, next) => {
  const authorization = req.header("Authorization")

  if (!authorization || !authorization.startsWith("Bearer "))
    return res.status(401).send();

  const token = authorization.split("Bearer ")[1]

  return pipe(
    T.Do,
    T.bind("ok", () => TOKENS.verifyToken(token)),
    T.map(({ ok }) => {
      if (ok) return next()
      return res.status(401).send()
    })
  )()
}

app.get("/auth/login/:username", async (req, res) => {
  const username = req.params["username"]
  return pipe(
    T.Do,
    T.bind("token", () => TOKENS.createToken({ subject: username })),
    T.tap(({ token }) => T.fromIO(() => res.json({ token })))
  )();
})

app.get("/protected", verifyAccessTokenMiddleware, (req, res) => {
  // TODO: Return something kul from here (anime girls).
  return res.json([])
})

app.listen(3000, () => console.log('Server started on port 3000'))
