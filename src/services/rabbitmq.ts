import client, { Connection, Channel, ConsumeMessage } from "amqplib";
import { UserInsert } from "../models/dbschema";

export default class RabbitMQService {
  connection!: Connection;
  channel!: Channel;

  connString: string;

  queue: string = "user-update";

  constructor(private host: string, user: string, pass: string) {

    this.connString = `amqp://${user}:${pass}@${host}:5672`
  }

  async connect() {
    console.log("Connecting to RabbitMQ");

    this.connection = await client.connect(this.connString);

    console.log("Connected to RabbitMQ");

    this.channel = await this.connection.createChannel();
  }

  async publishInQueue(queue: string, message: string) {
    if (!this.channel) {
      await this.connect();
    }

    await this.channel.assertQueue(queue, { durable: true });
    this.channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
  }

  async sendUserUpdateMessage(user: UserInsert) {
    const message = {
      user: user,
      action: "update",
    }

    await this.publishInQueue(this.queue, JSON.stringify(message));
  }

  async sendUserDeleteMessage(userId: string) {
    const message = {
      userId: userId,
      action: "delete",
    }

    await this.publishInQueue(this.queue, JSON.stringify(message));
  }

  async sendUserDeleteAllMessage(userId: string) {
    const message = {
      userId: userId,
      action: "deleteAll",
    }

    await this.publishInQueue(this.queue, JSON.stringify(message));
  }
}