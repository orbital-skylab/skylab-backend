import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import supertest from "supertest";
import { VOTER_ID_1 } from "../../__mocks__/voteEvent.mocks";
import app from "../../src/server";
import {
  voteEventTestSetUp,
  voteEventTestTearDown,
} from "../../src/utils/testUtils";

const BASE_URL = "/api/auth";

beforeEach(async () => {
  return await voteEventTestSetUp();
});

afterEach(async () => {
  return await voteEventTestTearDown();
});

describe("POST /sign-in/external-voter integration test", () => {
  it("should return 200 and true when valid voterId is provided", async () => {
    const response = await supertest
      .agent(app)
      .post(BASE_URL + "/sign-in/external-voter")
      .send({ voterId: VOTER_ID_1 });

    expect(response.status).toBe(200);
    expect(response.body).toBe(true);
  });

  it("should return 400 when voterId is not provided", async () => {
    const response = await supertest
      .agent(app)
      .post(BASE_URL + "/sign-in/external-voter")
      .send({});

    expect(response.status).toBe(400);
  });

  it("should return 404 when voterId is not found", async () => {
    const response = await supertest
      .agent(app)
      .post(BASE_URL + "/sign-in/external-voter")
      .send({ voterId: "invalid-voter-id" });

    expect(response.status).toBe(404);
  });
});
