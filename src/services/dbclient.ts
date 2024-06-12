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
  }

  async init() {
    try {
      await this.client.connect();
    }
    catch (err: any) {
      if (err.message === 'Client has already been connected. You cannot reuse a client.') {
        console.log('Client is already connected.');
      } else {
        throw err;
      }
    }
    
    this.db = drizzle(this.client);
    await this.db.select().from(users).limit(1);

    console.log("Database initialized");
  }

  async getUser(userID: string): Promise<User | null> {
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
    else {
      return null;
    }
  }

  async createUser(newUser: UserInsert): Promise<User> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const newuser = await this.db.insert(users).values(newUser).returning();
    return newuser[0];
  }

  async createOrUpdateUser(newUser: UserInsert): Promise<User> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const user = await this.db.select()
    .from(users)
    .where(
      eq(users.id, newUser.id)
    );

    if (user.length > 0) {
      const updatedUser = await this.db.update(users).set(newUser).where(
        eq(users.id, newUser.id)
      ).returning();
      return updatedUser[0];
    }
    else {
      const newuser = await this.db.insert(users).values(newUser).returning();
      return newuser[0];
    }
  }

  async updateUser(newUser: UserInsert): Promise<User> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const updatedUser = await this.db.update(users).set(newUser).where(
      eq(users.id, newUser.id)
    ).returning();
    return updatedUser[0];
  }

  async getUsers(): Promise<User[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const userList = await this.db.select().from(users);
    return userList;
  }

  async deleteUser(userID: string): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    await this.db.delete(users).where(
      eq(users.id, userID)
    );
  }

}


