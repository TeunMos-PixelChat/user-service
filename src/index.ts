import express, { Express, Request, Response } from 'express';
import dotenv from "dotenv";
import cors from 'cors';
import dbclient from './services/dbclient';
import Auth0Service from './services/auth0';

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
console.log(`isProduction: ${isProduction}`);

if (!process.env.POSTGRES_CONN_STRING) {
  console.error('Postgres connection string not set!')
}

if (!process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_SECRET || !process.env.AUTH0_DOMAIN) {
  console.error('Auth0 credentials not set!')
}


const db = new dbclient(process.env.POSTGRES_CONN_STRING as string);
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

  const accessToken = await auth0.getAccessToken();
  const users = await auth0.getUsers(accessToken);

  const formattedUsers = users.map((user) => {
    return {
      id: user.user_id,
      name: user.name,
      nickname: user.nickname,
      picture: user.picture,
    };
  });

  // TODO: get status of each user from db

  res.json(formattedUsers);
});



const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});


export { app, server }
