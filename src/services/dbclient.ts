import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import { user_service, users, users_friends, groups, users_groups, type User, UserInsert } from "../models/dbschema";
import { eq } from "drizzle-orm";

export default class dbclient {
  client: Client;
  db: NodePgDatabase<Record<string, never>> | undefined;

  constructor(connString: string) {
    
    this.client = new Client({
      connectionString: connString,
    })

    this.init();
  }

  async init() {
    await this.client.connect();
    this.db = drizzle(this.client);
    console.log("Database initialized");
  }

  async getOrCreateUser(userID: string): Promise<User> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const user = await this.db.select()
    .from(users)
    .where(
      eq(users.id, userID)
    );

    if (user.length > 0) {
      return user[0];
    }

    const newUser: UserInsert = {
      id: userID,
    };

    const newuser = await this.db.insert(users).values(newUser).returning();
    return newuser[0];
  }

}


