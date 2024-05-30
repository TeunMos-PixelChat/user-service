import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { pgSchema, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";


export const user_service = pgSchema("user_service");

export const users = user_service.table("users", {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    status: varchar('status', { length: 255 }),
    name: varchar('name', { length: 255 }).notNull(),
    nickname: varchar('nickname', { length: 255 }).notNull(),
    picture: varchar('picture', { length: 255 }).notNull(),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
  }
);

export const users_friends = user_service.table("users_friends", {
    userId: varchar('user_id', { length: 255 }).references(() => users.id, {
      onUpdate: 'cascade',
      onDelete: 'cascade',
    }).notNull(),
    friendId: varchar('friend_id', { length: 255 }).references(() => users.id, {
      onUpdate: 'cascade',
      onDelete: 'cascade',
    }).notNull(),
    createdAt: timestamp('created_at'),
  }
);

export const groups = user_service.table("groups", {
    id: serial('id').notNull().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    bannerUrl: varchar('banner_url', { length: 255 }),
    createdAt: timestamp('created_at'),
  }
);

export const users_groups = user_service.table("users_groups", {
    userId: varchar('user_id', { length: 255 }).references(() => users.id, {
      onUpdate: 'cascade',
      onDelete: 'cascade',
    }).notNull(),
    groupId: serial('group_id').references(() => groups.id, {
      onUpdate: 'cascade',
      onDelete: 'cascade',
    }).notNull(),
    createdAt: timestamp('created_at'),
  }
);

export type User = InferSelectModel<typeof users>;
export type UserFriend = InferSelectModel<typeof users_friends>;
export type Group = InferSelectModel<typeof groups>;
export type UserGroup = InferSelectModel<typeof users_groups>;

export type UserInsert = InferInsertModel<typeof users>;
export type UserFriendInsert = InferInsertModel<typeof users_friends>;
export type GroupInsert = InferInsertModel<typeof groups>;
export type UserGroupInsert = InferInsertModel<typeof users_groups>;

