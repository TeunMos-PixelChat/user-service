import supertest from "supertest"; // supertest is a framework that allows to easily test web APIs
import { app, server } from "../index";

// it("Testing to see if Jest works", () => {
//   expect(2).toBe(2);
// });

jest.mock("amqplib", () => ({
  connect: jest.fn().mockImplementation(() => ({
    createChannel: jest.fn().mockImplementation(() => ({
      assertQueue: jest.fn().mockImplementation(() => ({
        sendToQueue: jest.fn(),
      })),
      consume: jest.fn(),
      ack: jest.fn(),
    })),
  })),
}));

jest.mock("drizzle-orm/node-postgres", () => ({
  NodePgDatabase: jest.fn().mockImplementation(() => ({
    select: jest.fn().mockImplementation(() => ({
      from: jest.fn().mockImplementation(() => ({
        limit: jest.fn(),
      })),
    })),
  })),
  drizzle: jest.fn().mockImplementation(() => ({
    select: jest.fn().mockImplementation(() => ({
      from: jest.fn().mockImplementation(() => ({
        limit: jest.fn(),
      })),
    })),
  })),
}));


it("Root Endpoint /test", async () => {
  const response = await supertest(app).get("/");
  expect(response.text).toBe("Hello, world! Development, user-service");
});


it("Test Endpoint /test (with user)", async () => {
  const response = await supertest(app).post("/test").send({ message: "Hello, world!" }).set("x-user-id", "user123");
  expect(response.body).toStrictEqual({
    message: "Hello, world!",
    echo: { message: "Hello, world!" },
    meta: "This is a test endpoint. bloep blap bloop.\nYou are authorized.",
    userId: "user123",
  });
});

it("Test Endpoint test (without user)", async () => {
  const response = await supertest(app).post("/test").send({ message: "Hello, world!" });
  expect(response.body).toStrictEqual({ message: "Unauthorized" });
});


afterAll(done => {
  server?.close(done);
});