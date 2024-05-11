import express from "express"
import type { RequestHandler } from "express";
import * as T from "fp-ts/Task"
import * as TO from "fp-ts/TaskOption"
import { getJwtTokensSymmantics } from "./impls";
import { pipe } from "fp-ts/lib/function";
import { getInMemoryUsers } from "./impls/in_memory_users";
import bodyParser from "body-parser";
import * as API from "./api"
import _ from "lodash";

const app = express();

app.use(bodyParser.json())

app.get("/healthcheck", (_, res) => res.json("OK"))

const TOKENS = getJwtTokensSymmantics();
const USERS = getInMemoryUsers();

const PROGRAM = {
  ...TOKENS,
  ...USERS,
  ...T.MonadTask
}

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
    API.login(PROGRAM)(username, password),
    TO.fold(
      () => T.fromIO(() => res.status(401).send()),
      (token) => T.fromIO(() => res.status(200).json({ token }))
    ),
  )()
})

app.post("/auth/register", async (req, res) => {
  const { username, password } = req.body
  return pipe(
    API.register(PROGRAM)(username, password),
    TO.map(user => _.omit(user, "password")),
    TO.fold(
      () => T.fromIO(() => res.status(400).send()),
      (user) => T.fromIO(() => res.status(201).json(user)),
    ),
  )()
})

app.get("/anime-girls", verifyAccessTokenMiddleware, (_req, res) => {
  return res.json([
    {
      id: 1,
      name: "Chise Hatori",
      imageUrl: "https://raw.githubusercontent.com/cat-milk/Anime-Girls-Holding-Programming-Books/master/C%2B%2B/Chise_Hatori_Holding_C%2B%2B_Book.jpg",
    },
    {
      id: 2,
      name: "Frieren",
      imageUrl: "https://github.com/cat-milk/Anime-Girls-Holding-Programming-Books/blob/master/C++/Sousou_no_Frieren_c++.png?raw=true",
    },
    {
      id: 3,
      name: "Ryo Yamada",
      imageUrl: "https://github.com/cat-milk/Anime-Girls-Holding-Programming-Books/blob/master/Haskell/Ryo_Yamada_Holding_Haskell_Book.jpg?raw=true",
    },
    {
      id: 4,
      name: "Shinomiya Kaguya",
      imageUrl: "https://github.com/cat-milk/Anime-Girls-Holding-Programming-Books/blob/master/Haskell/Shinomiya_Kaguya_Holding_Haskell_Programming.png?raw=true",
    },
    {
      id: 5,
      name: "",
      imageUrl: "",
    },
  ])
})

app.listen(3000, () => console.log('Server started on port 3000'))
