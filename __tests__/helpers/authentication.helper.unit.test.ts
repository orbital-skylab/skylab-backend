import { afterEach, describe, expect, it, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { externalVoterLogin } from "../../src/helpers/authentication.helper";
import * as voteEventModel from "../../src/models/voteEvent.db";

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

const mockJwtSign = jwt.sign as jest.Mock;

afterEach(() => {
  jest.resetAllMocks();
});

describe("externalVoterLogin helper unit test", () => {
  let findFirstExternalVoterSpy;

  beforeEach(() => {
    findFirstExternalVoterSpy = jest.spyOn(
      voteEventModel,
      "findFirstExternalVoter"
    );
  });

  it("should return a token for the external voter", async () => {
    const voterId = "1";
    const token = "token";

    findFirstExternalVoterSpy.mockResolvedValueOnce({ id: voterId });
    mockJwtSign.mockReturnValueOnce(token);

    const results = await externalVoterLogin(voterId);

    expect(results.token).toBe(token);
    expect(findFirstExternalVoterSpy).toHaveBeenCalledTimes(1);
    expect(findFirstExternalVoterSpy).toHaveBeenCalledWith({
      where: { id: voterId },
    });
    expect(mockJwtSign).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if the voter ID is not found", async () => {
    const voterId = "1";

    findFirstExternalVoterSpy.mockResolvedValueOnce(null);

    await expect(externalVoterLogin(voterId)).rejects.toThrow(
      "Voter ID not found"
    );
  });
});
