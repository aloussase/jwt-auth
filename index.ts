import express from "express"
import type { RequestHandler } from "express";
import * as T from "fp-ts/Task"
import * as TO from "fp-ts/TaskOption"
import { getJwtTokensSymmantics } from "./impls";
import { pipe } from "fp-ts/lib/function";
import bodyParser from "body-parser";
import * as API from "./api"
import _ from "lodash";
import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import data from "./data.json"
import * as schema from "./db/schemas";
import { getDrizzleUsers } from "./impls/drizzle_users";
import { getDrizzlePayments } from "./impls/drizzle_payments";

const app = express();

const pool = new Pool({
  host: "127.0.0.1",
  port: 5432,
  user: "postgres",
  password: "jwtauth",
  database: "postgres",
});

const db = drizzle(pool, { schema })

app.use(bodyParser.json())

app.get("/healthcheck", (_, res) => res.json("OK"))

const TOKENS = getJwtTokensSymmantics();
const USERS = getDrizzleUsers(db);
const PAYMENTS = getDrizzlePayments(db);

const PROGRAM = {
  ...TOKENS,
  ...USERS,
  ...PAYMENTS,
  ...T.MonadTask
}

const verifyAccessTokenMiddleware: RequestHandler = (req, res, next) => {
  const authorization = req.header("Authorization")

  if (!authorization || !authorization.startsWith("Bearer "))
    return res.status(401).send();

  pipe(
    authorization.split("Bearer ")[1],
    TOKENS.verifyToken,
    TO.match(
      () => { res.status(401).send() },
      ({ subject }) => {
        req.username = subject;
        return next();
      }
    )
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

app.get("/anime-girls", verifyAccessTokenMiddleware, (_req, res) => res.json(data))

app.post("/quincenas", verifyAccessTokenMiddleware, async (req, res) => {
  const username = req.username!
  const { start_date, amount } = req.body
  return pipe(
    API.createQuincena(PROGRAM)(username, new Date(start_date), amount),
    TO.match(
      () => res.status(400).send(),
      (quincena) => res.status(201).json(quincena),
    )
  )()
})

app.get("/quincenas", verifyAccessTokenMiddleware, async (req, res) => {
  const username = req.username!
  return pipe(
    API.getAllQuincenas(PROGRAM)(username),
    T.map(quincenas => res.status(200).json(quincenas))
  )()
})

app.post("/quincenas/:id/payments", async (req, res) => {
  const username = req.username!;
  const quincena_id = parseInt(req.params['id']);
  const { description, amount } = req.body;
  return pipe(
    API.createPayment(PROGRAM)(username, quincena_id, description, amount),
    TO.match(
      () => res.status(404).send(),
      (payment) => res.status(201).json(payment),
    ),
  )()
})

app.get("/quincenas/:id/payments", async (req, res) => {
  const username = req.username!;
  const quincena_id = parseInt(req.params['id'])
  return pipe(
    API.getAllPayments(PROGRAM)(username, quincena_id),
    T.map(quincenas => res.status(200).json(quincenas))
  )()
})

app.post("/quincenas/:quincena_id/payments/:payment_id/fulfill", async (req, res) => {
  const username = req.username!;
  const quincena_id = parseInt(req.params['quincena_id']);
  const payment_id = parseInt(req.params['payment_id']);
  return pipe(
    API.fulfillPayment(PROGRAM)(username, quincena_id, payment_id),
    T.map((ok) => {
      if (ok) return res.status(204).send();
      return res.status(400).send();
    })
  )()
})

app.listen(3000, () => console.log('Server started on port 3000'))
