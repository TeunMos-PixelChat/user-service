process.env.RABBITMQ_HOST = "localhost";
process.env.RABBITMQ_USER = "user";
process.env.RABBITMQ_PASS = "pass";
process.env.POSTGRES_CONN_STRING = "test";
process.env.AUTH0_CLIENT_ID = "test";
process.env.AUTH0_CLIENT_SECRET = "test";
process.env.AUTH0_DOMAIN = "test";

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
  };