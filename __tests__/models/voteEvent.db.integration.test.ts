import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import {
  MOCK_VOTE_EVENT_1,
  MOCK_VOTE_EVENT_2,
  VOTER_ID_1,
  VOTER_ID_2,
} from "../../__mocks__/voteEvent.mocks";
import { prisma } from "../../src/client";
import {
  createOneVoteEvent,
  deleteVoteEvent,
  findManyExternalVoters,
  findManyVoteEvents,
  findUniqueVoteEvent,
  updateVoteEvent,
} from "../../src/models/voteEvent.db";
import {
  voteEventTestSetUp,
  voteEventTestTearDown,
} from "../../src/utils/testUtils";

let mockVoteEvent1Id: number;
let mockVoteEvent2Id: number;

beforeEach(async () => {
  const result = await voteEventTestSetUp();

  mockVoteEvent1Id = result.voteEvent1Id;
  mockVoteEvent2Id = result.voteEvent2Id;

  return result;
});

afterEach(async () => {
  return await voteEventTestTearDown();
});

describe("findManyVoteEvents db integration test", () => {
  it("should return all vote events", async () => {
    const voteEvents = await findManyVoteEvents({});

    expect(voteEvents).toEqual([
      { ...MOCK_VOTE_EVENT_1, id: mockVoteEvent1Id },
      { ...MOCK_VOTE_EVENT_2, id: mockVoteEvent2Id },
    ]);
  });
});

describe("findUniqueVoteEvent db integration test", () => {
  it("should return a single vote event by id", async () => {
    const voteEvent = await findUniqueVoteEvent({
      where: { id: mockVoteEvent1Id },
    });

    expect(voteEvent).toEqual({ ...MOCK_VOTE_EVENT_1, id: mockVoteEvent1Id });
  });
});

describe("createOneVoteEvent db integration test", () => {
  it("should create a new vote event", async () => {
    const newVoteEvent = await createOneVoteEvent({
      data: MOCK_VOTE_EVENT_1,
    });

    expect(newVoteEvent).toEqual({ ...MOCK_VOTE_EVENT_1, id: newVoteEvent.id });

    const dbCheck = await prisma.voteEvent.findUnique({
      where: { id: newVoteEvent.id },
    });
    expect(dbCheck).toEqual({ ...MOCK_VOTE_EVENT_1, id: newVoteEvent.id });
  });
});

describe("updateVoteEvent db integration test", () => {
  it("should update a vote event", async () => {
    const updatedVoteEvent = await updateVoteEvent({
      where: { id: mockVoteEvent1Id },
      data: { ...MOCK_VOTE_EVENT_1, title: "Updated Vote Event" },
    });

    expect(updatedVoteEvent).toEqual({
      ...MOCK_VOTE_EVENT_1,
      id: mockVoteEvent1Id,
      title: "Updated Vote Event",
    });

    const dbCheck = await prisma.voteEvent.findUnique({
      where: { id: mockVoteEvent1Id },
    });
    expect(dbCheck).toEqual({
      ...MOCK_VOTE_EVENT_1,
      id: mockVoteEvent1Id,
      title: "Updated Vote Event",
    });
  });
});

describe("deleteVoteEvent db integration test", () => {
  it("should delete a vote event", async () => {
    const deletedVoteEvent = await deleteVoteEvent({
      where: { id: mockVoteEvent1Id },
    });

    expect(deletedVoteEvent).toEqual({
      ...MOCK_VOTE_EVENT_1,
      id: mockVoteEvent1Id,
    });

    const dbCheck = await prisma.voteEvent.findUnique({
      where: { id: mockVoteEvent1Id },
    });
    expect(dbCheck).toBeNull();
  });
});

describe("findManyExternalVoters db integration test", () => {
  it("should return all external voters", async () => {
    const externalVoters = await findManyExternalVoters({
      where: { voteEventId: mockVoteEvent1Id },
    });

    expect(externalVoters).toEqual([
      { id: VOTER_ID_1, voteEventId: mockVoteEvent1Id },
      { id: VOTER_ID_2, voteEventId: mockVoteEvent1Id },
    ]);
  });
});

describe("createExternalVoter db integration test", () => {
  it("should create a new external voter", async () => {
    const externalVoter = {
      id: "newVoter",
      voteEventId: mockVoteEvent1Id,
    };

    const newExternalVoter = await prisma.externalVoter.create({
      data: externalVoter,
    });

    expect(newExternalVoter).toEqual(externalVoter);

    const dbCheck = await prisma.externalVoter.findUnique({
      where: { id_voteEventId: externalVoter },
    });
    expect(dbCheck).toEqual(externalVoter);
  });
});

describe("deleteExternalVoter db integration test", () => {
  it("should delete an external voter", async () => {
    const toDelete = { id: VOTER_ID_1, voteEventId: mockVoteEvent1Id };

    const deletedExternalVoter = await prisma.externalVoter.delete({
      where: {
        id_voteEventId: toDelete,
      },
    });

    expect(deletedExternalVoter).toEqual(toDelete);

    const dbCheck = await prisma.externalVoter.findUnique({
      where: {
        id_voteEventId: toDelete,
      },
    });
    expect(dbCheck).toBeNull();
  });
});
