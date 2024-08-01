import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import {
  MOCK_EXTERNAL_VOTER_1,
  MOCK_EXTERNAL_VOTER_2,
  MOCK_VOTE_1,
  MOCK_VOTE_2,
  MOCK_VOTE_EVENT_1,
  MOCK_VOTE_EVENT_2,
} from "../../__mocks__/voteEvent.mocks";
import { prisma } from "../../src/client";
import { SkylabError } from "../../src/errors/SkylabError";
import {
  createExternalVoter,
  createManyVotes,
  createOneVoteEvent,
  deleteExternalVoter,
  deleteVote,
  deleteVoteEvent,
  findManyExternalVoters,
  findManyVoteEvents,
  findManyVotes,
  findUniqueVoteEvent,
  updateVoteEvent,
} from "../../src/models/voteEvent.db";
import { HttpStatusCode } from "../../src/utils/HTTP_Status_Codes";

const PRISMA_CLIENT_KNOWN_REQUEST_ERROR = new PrismaClientKnownRequestError(
  "request error",
  "P2025",
  "3.0.0"
);

const expectedSkylabError = new SkylabError(
  PRISMA_CLIENT_KNOWN_REQUEST_ERROR.message,
  HttpStatusCode.BAD_REQUEST,
  PRISMA_CLIENT_KNOWN_REQUEST_ERROR.meta
);

afterEach(() => {
  jest.resetAllMocks();
});

describe("findManyVoteEvents db unit test", () => {
  let findManyVoteEventsSpy;
  const params = {};

  beforeAll(() => {
    findManyVoteEventsSpy = jest.spyOn(prisma.voteEvent, "findMany");
  });

  it("should return call prisma function with the correct args and return the correct values", async () => {
    const mockVoteEvents = [MOCK_VOTE_EVENT_1, MOCK_VOTE_EVENT_2];
    findManyVoteEventsSpy.mockResolvedValueOnce(mockVoteEvents);

    const result = await findManyVoteEvents(params);

    expect(result).toEqual(mockVoteEvents);
    expect(findManyVoteEventsSpy).toHaveBeenCalledTimes(1);
    expect(findManyVoteEventsSpy).toHaveBeenCalledWith(params);
  });

  it("should return an error with http status code 400 if the prisma function throws a known request error", async () => {
    findManyVoteEventsSpy.mockRejectedValueOnce(
      PRISMA_CLIENT_KNOWN_REQUEST_ERROR
    );

    await expect(findManyVoteEvents(params)).rejects.toEqual(
      expectedSkylabError
    );
  });
});

describe("findUniqueVoteEvents db unit test", () => {
  let findUniqueVoteEventSpy;
  const params = { where: { id: 1 } };

  beforeAll(() => {
    findUniqueVoteEventSpy = jest.spyOn(prisma.voteEvent, "findUnique");
  });

  it("should return call prisma function with the correct args and return the correct values", async () => {
    findUniqueVoteEventSpy.mockResolvedValueOnce(MOCK_VOTE_EVENT_1);

    const result = await findUniqueVoteEvent(params);

    expect(result).toEqual(MOCK_VOTE_EVENT_1);
    expect(findUniqueVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(findUniqueVoteEventSpy).toHaveBeenCalledWith({
      ...params,
      rejectOnNotFound: false,
    });
  });

  it("should return an error with http status code 400 if the prisma function throws a known request error", async () => {
    findUniqueVoteEventSpy.mockRejectedValueOnce(
      PRISMA_CLIENT_KNOWN_REQUEST_ERROR
    );

    await expect(findUniqueVoteEvent(params)).rejects.toEqual(
      expectedSkylabError
    );
  });
});

describe("createOneVoteEvent db unit test", () => {
  let createOneVoteEventSpy;
  const params = { data: MOCK_VOTE_EVENT_1 };

  beforeAll(() => {
    createOneVoteEventSpy = jest.spyOn(prisma.voteEvent, "create");
  });

  it("should call prisma function with the correct args and return the correct values", async () => {
    createOneVoteEventSpy.mockResolvedValueOnce(MOCK_VOTE_EVENT_1);

    const result = await createOneVoteEvent(params);

    expect(result).toEqual(MOCK_VOTE_EVENT_1);
    expect(createOneVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(createOneVoteEventSpy).toHaveBeenCalledWith(params);
  });

  it("should return an error with http status code 400 if the prisma function throws a known request error", async () => {
    createOneVoteEventSpy.mockRejectedValueOnce(
      PRISMA_CLIENT_KNOWN_REQUEST_ERROR
    );

    await expect(createOneVoteEvent(params)).rejects.toEqual(
      expectedSkylabError
    );
  });
});

describe("updateVoteEvent db unit test", () => {
  let updateVoteEventSpy;
  const params = { where: { id: 1 }, data: MOCK_VOTE_EVENT_1 };

  beforeAll(() => {
    updateVoteEventSpy = jest.spyOn(prisma.voteEvent, "update");
  });

  it("should call prisma function with the correct args and return the correct values", async () => {
    updateVoteEventSpy.mockResolvedValueOnce(MOCK_VOTE_EVENT_1);

    const result = await updateVoteEvent(params);

    expect(result).toEqual(MOCK_VOTE_EVENT_1);
    expect(updateVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(updateVoteEventSpy).toHaveBeenCalledWith(params);
  });

  it("should return an error with http status code 400 if the prisma function throws a known request error", async () => {
    updateVoteEventSpy.mockRejectedValueOnce(PRISMA_CLIENT_KNOWN_REQUEST_ERROR);

    await expect(updateVoteEvent(params)).rejects.toEqual(expectedSkylabError);
  });
});

describe("deleteVoteEvent db unit test", () => {
  let deleteVoteEventSpy;
  const params = { where: { id: 1 } };

  beforeAll(() => {
    deleteVoteEventSpy = jest.spyOn(prisma.voteEvent, "delete");
  });

  it("should call prisma function with the correct args and return the correct values", async () => {
    deleteVoteEventSpy.mockResolvedValueOnce(MOCK_VOTE_EVENT_1);

    const result = await deleteVoteEvent(params);

    expect(result).toEqual(MOCK_VOTE_EVENT_1);
    expect(deleteVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(deleteVoteEventSpy).toHaveBeenCalledWith(params);
  });

  it("should return an error with http status code 400 if the prisma function throws a known request error", async () => {
    deleteVoteEventSpy.mockRejectedValueOnce(PRISMA_CLIENT_KNOWN_REQUEST_ERROR);

    await expect(deleteVoteEvent(params)).rejects.toEqual(expectedSkylabError);
  });
});

describe("findManyExternalVoters db unit test", () => {
  let findManyExternalVotersSpy;
  const params = {};

  beforeAll(() => {
    findManyExternalVotersSpy = jest.spyOn(prisma.externalVoter, "findMany");
  });

  it("should call prisma function with the correct args and return the correct values", async () => {
    const mockExternalVoters = [MOCK_EXTERNAL_VOTER_1, MOCK_EXTERNAL_VOTER_2];
    findManyExternalVotersSpy.mockResolvedValueOnce(mockExternalVoters);

    const result = await findManyExternalVoters(params);

    expect(result).toEqual(mockExternalVoters);
    expect(findManyExternalVotersSpy).toHaveBeenCalledTimes(1);
    expect(findManyExternalVotersSpy).toHaveBeenCalledWith(params);
  });

  it("should return an error with http status code 400 if the prisma function throws a known request error", async () => {
    findManyExternalVotersSpy.mockRejectedValueOnce(
      PRISMA_CLIENT_KNOWN_REQUEST_ERROR
    );

    await expect(findManyExternalVoters(params)).rejects.toEqual(
      expectedSkylabError
    );
  });
});

describe("createExternalVoter db unit test", () => {
  let createExternalVoterSpy;
  const params = { data: MOCK_EXTERNAL_VOTER_1 };

  beforeAll(() => {
    createExternalVoterSpy = jest.spyOn(prisma.externalVoter, "create");
  });

  it("should call prisma function with the correct args and return the correct values", async () => {
    createExternalVoterSpy.mockResolvedValueOnce(MOCK_EXTERNAL_VOTER_1);

    const result = await createExternalVoter(params);

    expect(result).toEqual(MOCK_EXTERNAL_VOTER_1);
    expect(createExternalVoterSpy).toHaveBeenCalledTimes(1);
    expect(createExternalVoterSpy).toHaveBeenCalledWith(params);
  });

  it("should return an error with http status code 400 if the prisma function throws a known request error", async () => {
    createExternalVoterSpy.mockRejectedValueOnce(
      PRISMA_CLIENT_KNOWN_REQUEST_ERROR
    );

    await expect(createExternalVoter(params)).rejects.toEqual(
      expectedSkylabError
    );
  });
});

describe("deleteExternalVoter db unit test", () => {
  let deleteExternalVoterSpy;
  const params = {
    where: {
      id_voteEventId: {
        id: MOCK_EXTERNAL_VOTER_1.id,
        voteEventId: MOCK_EXTERNAL_VOTER_1.voteEventId,
      },
    },
  };

  beforeAll(() => {
    deleteExternalVoterSpy = jest.spyOn(prisma.externalVoter, "delete");
  });

  it("should call prisma function with the correct args and return the correct values", async () => {
    deleteExternalVoterSpy.mockResolvedValueOnce(MOCK_EXTERNAL_VOTER_1);

    const result = await deleteExternalVoter(params);

    expect(result).toEqual(MOCK_EXTERNAL_VOTER_1);
    expect(deleteExternalVoterSpy).toHaveBeenCalledTimes(1);
    expect(deleteExternalVoterSpy).toHaveBeenCalledWith(params);
  });

  it("should return an error with http status code 400 if the prisma function throws a known request error", async () => {
    deleteExternalVoterSpy.mockRejectedValueOnce(
      PRISMA_CLIENT_KNOWN_REQUEST_ERROR
    );

    await expect(deleteExternalVoter(params)).rejects.toEqual(
      expectedSkylabError
    );
  });
});

describe("findManyVotes db unit test", () => {
  let findManyVotesSpy;
  const params = {};

  beforeAll(() => {
    findManyVotesSpy = jest.spyOn(prisma.vote, "findMany");
  });

  it("should call prisma function with the correct args and return the correct values", async () => {
    const mockVotes = [MOCK_VOTE_1, MOCK_VOTE_2];
    findManyVotesSpy.mockResolvedValueOnce(mockVotes);

    const result = await findManyVotes(params);

    expect(result).toEqual(mockVotes);
    expect(findManyVotesSpy).toHaveBeenCalledTimes(1);
    expect(findManyVotesSpy).toHaveBeenCalledWith(params);
  });

  it("should return an error with http status code 400 if the prisma function throws a known request error", async () => {
    findManyVotesSpy.mockRejectedValueOnce(PRISMA_CLIENT_KNOWN_REQUEST_ERROR);

    await expect(findManyVotes(params)).rejects.toEqual(expectedSkylabError);
  });
});

describe("createManyVotes db unit test", () => {
  let createManyVotesSpy;
  const params = {
    data: [
      { ...MOCK_VOTE_1, userId: undefined },
      { ...MOCK_VOTE_2, userId: undefined },
    ],
  };

  beforeAll(() => {
    createManyVotesSpy = jest.spyOn(prisma.vote, "createMany");
  });

  it("should call prisma function with the correct args and return the correct values", async () => {
    createManyVotesSpy.mockResolvedValueOnce({ count: 2 });

    const result = await createManyVotes(params);

    expect(result).toEqual({ count: 2 });
    expect(createManyVotesSpy).toHaveBeenCalledTimes(1);
    expect(createManyVotesSpy).toHaveBeenCalledWith(params);
  });

  it("should return an error with http status code 400 if the prisma function throws a known request error", async () => {
    createManyVotesSpy.mockRejectedValueOnce(PRISMA_CLIENT_KNOWN_REQUEST_ERROR);

    await expect(createManyVotes(params)).rejects.toThrowError(
      expectedSkylabError
    );
  });
});

describe("deleteVote db unit test", () => {
  let deleteVoteSpy;
  const params = { where: { id: 1 } };

  beforeAll(() => {
    deleteVoteSpy = jest.spyOn(prisma.vote, "delete");
  });

  it("should call prisma function with the correct args and return the correct values", async () => {
    deleteVoteSpy.mockResolvedValueOnce(MOCK_VOTE_1);

    const result = await deleteVote(params);

    expect(result).toEqual(MOCK_VOTE_1);
    expect(deleteVoteSpy).toHaveBeenCalledTimes(1);
    expect(deleteVoteSpy).toHaveBeenCalledWith(params);
  });

  it("should return an error with http status code 400 if the prisma function throws a known request error", async () => {
    deleteVoteSpy.mockRejectedValueOnce(PRISMA_CLIENT_KNOWN_REQUEST_ERROR);

    await expect(deleteVote(params)).rejects.toEqual(expectedSkylabError);
  });
});
