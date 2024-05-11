import express from "express"
import type { RequestHandler } from "express";
import * as T from "fp-ts/Task"
import * as O from "fp-ts/Option"
import { compare, hash } from "bcryptjs"

import { getJwtTokensSymmantics } from "./impls";
import { pipe } from "fp-ts/lib/function";
import { getInMemoryUsers } from "./impls/in_memory_users";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.json())

app.get("/healthcheck", (_, res) => res.json("OK"))

const TOKENS = getJwtTokensSymmantics();
const USERS = getInMemoryUsers();

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

app.post("/auth/login/", async (req, res) => {
  const { username, password } = req.body
  pipe(
    T.Do,
    T.bind("maybeUser", () => USERS.getUserByUsername(username)),
    T.chain(({ maybeUser }) => {
      return pipe(
        maybeUser,
        O.match(
          () => T.fromIO(() => res.status(404).send()),
          (user) => {
            return pipe(
              T.Do,
              T.bind("ok", () => () => compare(password, user.password)),
              T.chain(({ ok }) => {
                if (ok) {
                  return pipe(
                    T.Do,
                    T.bind("token", () => TOKENS.createToken({ subject: username })),
                    T.chain(({ token }) => T.fromIO(() => res.json({ token })))
                  )
                } else {
                  return T.fromIO(() => res.status(401).send())
                }
              }),
            )
          },
        )
      )
    })
  )()
})

app.post("/auth/register", async (req, res) => {
  const { username, password } = req.body
  return pipe(
    T.Do,
    T.bind("hashedPassword", () => () => hash(password, 10)),
    T.bind("maybeUser", ({ hashedPassword }) => USERS.createUser(username, hashedPassword)),
    T.chain(({ maybeUser }) => {
      return pipe(
        maybeUser,
        O.match(
          () => T.fromIO(() => res.status(400).send()),
          (user) => T.fromIO(() => res.status(201).json(user)),
        )
      );
    })
  )();
})

app.get("/protected", verifyAccessTokenMiddleware, (req, res) => {
  // TODO: Return something kul from here (anime girls).
  return res.json([])
})

app.listen(3000, () => console.log('Server started on port 3000'))
