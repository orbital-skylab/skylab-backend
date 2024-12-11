import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import supertest from "supertest";
import { VOTER_ID_1 } from "../../__mocks__/voteEvent.mocks";
import * as authHelpers from "../../src/helpers/authentication.helper";
import app from "../../src/server";
import * as utils from "../../src/utils/ApiResponseWrapper";

const BASE_URL = "/api/auth";

describe("POST /sign-in/external-voter unit test", () => {
  let externalVoterLoginSpy;

  beforeAll(() => {
    externalVoterLoginSpy = jest.spyOn(authHelpers, "externalVoterLogin");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call helper function to sign in external voters", async () => {
    externalVoterLoginSpy.mockResolvedValueOnce({ token: "token" });

    await supertest(app)
      .post(BASE_URL + "/sign-in/external-voter")
      .send({ voterId: VOTER_ID_1 });

    expect(externalVoterLoginSpy).toHaveBeenCalledTimes(1);
    expect(externalVoterLoginSpy).toHaveBeenCalledWith(VOTER_ID_1);
  });

  it("should call the error handler if an error is thrown", async () => {
    const routeErrorHandlerSpy = jest.spyOn(utils, "routeErrorHandler");

    externalVoterLoginSpy.mockRejectedValueOnce(new Error("error"));

    await supertest(app)
      .post(BASE_URL + "/sign-in/external-voter")
      .send({ voterId: VOTER_ID_1 });

    expect(externalVoterLoginSpy).toHaveBeenCalledTimes(1);
    expect(routeErrorHandlerSpy).toHaveBeenCalledTimes(1);
    expect(routeErrorHandlerSpy).toHaveBeenCalledWith(
      expect.any(Object),
      new Error("error")
    );
  });
});
