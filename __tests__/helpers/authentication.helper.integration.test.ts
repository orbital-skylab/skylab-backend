import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { VOTER_ID_1 } from "../../__mocks__/voteEvent.mocks";
import { externalVoterLogin } from "../../src/helpers/authentication.helper";
import {
  voteEventTestSetUp,
  voteEventTestTearDown,
} from "../../src/utils/testUtils";

beforeEach(async () => {
  await voteEventTestSetUp();
});

afterEach(async () => {
  return await voteEventTestTearDown();
});

describe("externalVoterLogin helper integration test", () => {
  it("should return a token for the external voter", async () => {
    const result = await externalVoterLogin(VOTER_ID_1);

    expect(result.token).toBeTruthy();
  });

  it("should throw an error if the voter ID is not found", async () => {
    const voterId = "non existent voter ID";

    await expect(externalVoterLogin(voterId)).rejects.toThrow(
      "Voter ID not found"
    );
  });
});
