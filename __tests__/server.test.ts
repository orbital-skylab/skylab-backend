import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import app from "../src/server";

describe("GET /", () => {
  it('Responds with "Server is running" and status code 200', async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toBe("Server is running");
  });
});
