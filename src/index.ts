import express, { Express, Request, Response } from 'express';
import dotenv from "dotenv";
import cors from 'cors';
import dbclient from './services/dbclient';
import Auth0Service from './services/auth0';
import { UserInsert } from './models/dbschema';
import RabbitMQService from './services/rabbitmq';
import * as http from 'http';

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
console.log(`isProduction: ${isProduction}`);

if (!process.env.POSTGRES_CONN_STRING) {
  console.error('Postgres connection string not set!')
}

if (!process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_SECRET || !process.env.AUTH0_DOMAIN) {
  console.error('Auth0 credentials not set!')
}

if (!process.env.RABBITMQ_HOST || !process.env.RABBITMQ_USER || !process.env.RABBITMQ_PASS) {
  console.error('RabbitMQ credentials not set!')
}

const db = new dbclient(process.env.POSTGRES_CONN_STRING as string);


const rabbitmq = new RabbitMQService(
  process.env.RABBITMQ_HOST as string,
  process.env.RABBITMQ_USER as string,
  process.env.RABBITMQ_PASS as string,
);

const auth0 = new Auth0Service(
  process.env.AUTH0_CLIENT_ID as string,
  process.env.AUTH0_CLIENT_SECRET as string,
  process.env.AUTH0_DOMAIN as string,
);

const app: Express = express();
const port = process.env.PORT || 3002;


function useAuthUser(req: Request, res: Response) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  return userId as string;
}

async function getUser(userId: string)  {
  const user = await db.getUser(userId);

  if (!user) {
    console.log(`User not found in database, fetching from Auth0: ${userId}`);
    const accessToken = await auth0.getAccessToken();
    const auth0User = await auth0.getUser(accessToken, userId);
    
    if (!auth0User.user_id || !auth0User.name || !auth0User.nickname || !auth0User.picture) {
      throw new Error("Invalid user data");
    }

    const newUser = await db.createUser({
      id: auth0User.user_id,
      name: auth0User.name,
      nickname: auth0User.nickname,
      picture: auth0User.picture,
    });
    console.log(`User created in database: ${newUser.id}`);

    await rabbitmq.sendUserUpdateMessage(newUser);

    return newUser;
  }
  return user;
}

app.use(cors({
  // origin: process.env.FRONTEND_URL || 'http://localhost:3000'
  origin: "*"
}));

app.use(express.json()); // for parsing application/json

// log all requests
app.use((req, res, next) => {
  console.log(`[${req.method}]: ${req.path}`);
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.send(`Hello, world! ${isProduction ? "Production" : "Development"}, user-service`);
});


app.post("/test", (req: Request, res: Response) => {
  const body = req.body;
  const user = useAuthUser(req, res);
  if (!user) return; // unauthorized
  
  res.json({
    message: "Hello, world!",
    echo: body,
    meta: "This is a test endpoint. bloep blap bloop.\nYou are authorized.",
    userId: user,
  });
});

app.get("/users", async (req: Request, res: Response) => {
  const user = useAuthUser(req, res);
  if (!user) return; // unauthorized

  // const accessToken = await auth0.getAccessToken();
  // const users = await auth0.getUsers(accessToken);

  const users = await db.getUsers();

  const formattedUsers = users.map((user) => {
    return {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      picture: user.picture,
    };
  });

  // remove this in the future
  // formattedUsers.forEach(async (user) => {
  //   if (!user.id) return;
  //   await getUser(user.id);
  // });

  res.json(formattedUsers);
});


app.get("/user/:id", async (req: Request, res: Response) => {
  const user = useAuthUser(req, res);
  if (!user) return; // unauthorized

  const userId = req.params.id;
  const userRecord = await getUser(userId);

  res.json(userRecord);
});

app.get("/user", async (req: Request, res: Response) => {
  const user = useAuthUser(req, res);
  if (!user) return; // unauthorized

  const userRecord = await getUser(user);

  res.json(userRecord);
});


app.patch("/user", async (req: Request, res: Response) => {
  const user = useAuthUser(req, res);
  if (!user) return; // unauthorized

  const accessToken = await auth0.getAccessToken();

  // TODO: update user in auth0

  const auth0User = await auth0.getUser(accessToken, user);

  if (!auth0User.user_id || !auth0User.name || !auth0User.nickname || !auth0User.picture) {
    res.status(400).json({ message: "Invalid user data" });
    return;
  }

  const updatedUser = await db.updateUser({
    id: auth0User.user_id,
    name: auth0User.name,
    nickname: auth0User.nickname,
    picture: auth0User.picture,
    updatedAt: new Date(),
  });
  res.json(updatedUser);
});


// probably not going to be used
app.post("/user", async (req: Request, res: Response) => {
  const user = useAuthUser(req, res);
  if (!user) return; // unauthorized

  const accessToken = await auth0.getAccessToken();
  const auth0User = await auth0.getUser(accessToken, user);

  if (!auth0User) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (!auth0User.user_id || !auth0User.name || !auth0User.nickname || !auth0User.picture) {
    res.status(400).json({ message: "Invalid user data" });
    return;
  }

  const newUser: UserInsert = {
    id: auth0User.user_id,
    name: auth0User.name,
    nickname: auth0User.nickname,
    picture: auth0User.picture,
  };

  const createdUser = await db.createUser(newUser);
  res.json(createdUser);
});

let server: http.Server | null = null;

db.init().then(() => {
  server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
});

app.delete("/user", async (req: Request, res: Response) => {
  const user = useAuthUser(req, res);
  if (!user) return; // unauthorized

  const deletedUser = await db.deleteUser(user);

  rabbitmq.sendUserDeleteMessage(user);

  res.json(deletedUser);
});


app.delete("/user/data", async (req: Request, res: Response) => {
  const user = useAuthUser(req, res);
  if (!user) return; // unauthorized

  const deletedUser = await db.deleteUser(user);
  const accessToken = await auth0.getAccessToken();
  await auth0.deleteUser(accessToken, user);

  rabbitmq.sendUserDeleteAllMessage(user);

  res.json(deletedUser);
});

export { app, server }
