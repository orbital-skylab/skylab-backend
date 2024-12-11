/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { AchievementLevel } from "@prisma/client";
import {
  MOCK_EXTERNAL_VOTER_1,
  MOCK_EXTERNAL_VOTER_2,
  MOCK_PROJECT_1_WITH_ID,
  MOCK_PROJECT_2_WITH_ID,
  MOCK_UPDATED_VOTE_EVENT_1,
  MOCK_USER_1,
  MOCK_VOTE_1,
  MOCK_VOTE_CONFIG,
  MOCK_VOTE_EVENT_1,
  MOCK_VOTE_EVENT_1_WITH_ID,
  MOCK_VOTE_EVENT_2_WITH_ID,
  MOCK_VOTER_MANAGEMENT,
  NON_EXISTENT_ID,
  NON_EXISTENT_USER_EMAIL,
  VOTER_ID_1,
} from "../../__mocks__/voteEvent.mocks";
import { prisma } from "../../src/client";
import { SkylabError } from "../../src/errors/SkylabError";
import {
  formatUserWithRoleData,
  removePasswordFromUser,
} from "../../src/helpers/users.helper";
import * as voteEventHelper from "../../src/helpers/voteEvent.helper";
import {
  addCandidate,
  addExternalVoter,
  addInternalVoter,
  addManyCandidates,
  addManyExternalVoters,
  addManyInternalVoters,
  addManyVotes,
  calculateResults,
  DEFAULT_RESULTS_FILTER,
  editVoteEvent,
  editVoterManagement,
  generateExternalVoters,
  getAllCandidatesByVoteEvent,
  getAllExternalVotersByVoteEvent,
  getAllInternalVotersByVoteEvent,
  getAllVoteEvents,
  getAllVotesByVoteEvent,
  getExternalVoterVoteEvents,
  getInternalVoterVoteEvents,
  getOneVoteEventById,
  getResultsByVoteEvent,
  getVotesByVoteEventAndVoter,
  removeCandidate,
  removeExternalVoter,
  removeInternalVoter,
  removeVote,
  removeVoteEvent,
  VOTE_EVENT_INCLUSION,
  VOTE_EVENT_PUBLIC_INCLUSION,
} from "../../src/helpers/voteEvent.helper";
import * as projectModel from "../../src/models/projects.db";
import * as userModel from "../../src/models/users.db";
import * as voteEventModel from "../../src/models/voteEvent.db";
import { HttpStatusCode } from "../../src/utils/HTTP_Status_Codes";

afterEach(() => {
  jest.resetAllMocks();
});

describe("calculateResults function unit test", () => {
  it("should calculate the results correctly", () => {
    const votes = [
      {
        id: 1,
        voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
        projectId: MOCK_PROJECT_1_WITH_ID.id,
        userId: MOCK_USER_1.id,
        externalVoterId: null,
        project: {
          ...MOCK_PROJECT_1_WITH_ID,
          achievement: MOCK_PROJECT_1_WITH_ID.achievement as AchievementLevel,
        },
        internalVoter: {
          ...MOCK_USER_1,
          mentor: [{ id: 1, userId: MOCK_USER_1.id, cohortYear: 2024 }],
        },
      },
      {
        id: 2,
        voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
        projectId: MOCK_PROJECT_2_WITH_ID.id,
        userId: MOCK_USER_1.id,
        externalVoterId: null,
        project: {
          ...MOCK_PROJECT_2_WITH_ID,
          achievement: MOCK_PROJECT_2_WITH_ID.achievement as AchievementLevel,
        },
        internalVoter: {
          ...MOCK_USER_1,
          mentor: [{ id: 1, userId: MOCK_USER_1.id, cohortYear: 2024 }],
        },
      },
      {
        id: 3,
        voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
        projectId: MOCK_PROJECT_1_WITH_ID.id,
        userId: null,
        externalVoterId: VOTER_ID_1,
        project: {
          ...MOCK_PROJECT_1_WITH_ID,
          achievement: MOCK_PROJECT_1_WITH_ID.achievement as AchievementLevel,
        },
        internalVoter: null,
      },
    ];

    const resultsFilter = {
      ...DEFAULT_RESULTS_FILTER,
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
      areResultsPublished: true,
    };

    const expectedResults = [
      {
        rank: 1,
        percentage: 66.67,
        project: {
          ...MOCK_PROJECT_1_WITH_ID,
          achievement: MOCK_PROJECT_1_WITH_ID.achievement as AchievementLevel,
        },
        votes: 2,
        points: 2,
      },
      {
        rank: 2,
        percentage: 33.33,
        project: {
          ...MOCK_PROJECT_2_WITH_ID,
          achievement: MOCK_PROJECT_2_WITH_ID.achievement as AchievementLevel,
        },
        votes: 1,
        points: 1,
      },
    ];

    const calculatedResults = calculateResults(votes, resultsFilter);

    expect(calculatedResults).toEqual(expectedResults);
  });
});

// --- Vote Event Helper Functions Tests ---

describe("getAllVoteEvents helper unit test", () => {
  let findManyVoteEventsSpy;

  beforeAll(() => {
    findManyVoteEventsSpy = jest.spyOn(voteEventModel, "findManyVoteEvents");
  });

  it("should return all vote events", async () => {
    const mockVoteEvents = [
      MOCK_VOTE_EVENT_1_WITH_ID,
      MOCK_VOTE_EVENT_2_WITH_ID,
    ];
    findManyVoteEventsSpy.mockResolvedValueOnce(mockVoteEvents);

    const result = await getAllVoteEvents();

    expect(result).toEqual(mockVoteEvents);
    expect(findManyVoteEventsSpy).toHaveBeenCalledTimes(1);
    expect(findManyVoteEventsSpy).toHaveBeenCalledWith({
      include: VOTE_EVENT_PUBLIC_INCLUSION,
    });
  });

  it("should return an empty array if no vote events found", async () => {
    findManyVoteEventsSpy.mockResolvedValueOnce([]);

    const result = await getAllVoteEvents();

    expect(result).toEqual([]);
    expect(findManyVoteEventsSpy).toHaveBeenCalledTimes(1);
    expect(findManyVoteEventsSpy).toHaveBeenCalledWith({
      include: VOTE_EVENT_PUBLIC_INCLUSION,
    });
  });
});

describe("getInternalVoterVoteEvents helper unit test", () => {
  let findManyVoteEventsSpy;

  beforeAll(() => {
    findManyVoteEventsSpy = jest.spyOn(voteEventModel, "findManyVoteEvents");
  });

  it("should return all vote events for an internal voter", async () => {
    const mockVoteEvents = [
      MOCK_VOTE_EVENT_1_WITH_ID,
      MOCK_VOTE_EVENT_2_WITH_ID,
    ];
    findManyVoteEventsSpy.mockResolvedValueOnce(mockVoteEvents);
    findManyVoteEventsSpy.mockResolvedValueOnce([]);

    const result = await getInternalVoterVoteEvents(MOCK_USER_1.id);

    expect(result).toEqual(
      mockVoteEvents.map((ve) => {
        return {
          ...ve,
          voterManagement: { ...voteEventHelper.DEFAULT_REGISTRATION_PERIOD },
        };
      })
    );
    expect(findManyVoteEventsSpy).toHaveBeenCalledTimes(2);
    expect(findManyVoteEventsSpy).toHaveBeenNthCalledWith(1, {
      where: {
        internalVoters: { some: { id: MOCK_USER_1.id } },
        voterManagement: { isNot: null },
        voteConfig: { isNot: null },
      },
      include: VOTE_EVENT_PUBLIC_INCLUSION,
    });
    expect(findManyVoteEventsSpy).toHaveBeenNthCalledWith(2, {
      where: {
        id: { notIn: mockVoteEvents.map((ve) => ve.id) },
        voterManagement: {
          registrationStartTime: { lte: expect.any(Date) },
          registrationEndTime: { gte: expect.any(Date) },
        },
        voteConfig: { isNot: null },
      },
      include: VOTE_EVENT_PUBLIC_INCLUSION,
    });
  });

  it("should return an empty array if no vote events found", async () => {
    findManyVoteEventsSpy.mockResolvedValue([]);

    const result = await getInternalVoterVoteEvents(MOCK_USER_1.id);

    expect(result).toEqual([]);
    expect(findManyVoteEventsSpy).toHaveBeenCalledTimes(2);
  });
});

describe("getExternalVoterVoteEvents helper unit test", () => {
  let findManyVoteEventsSpy;

  beforeAll(() => {
    findManyVoteEventsSpy = jest.spyOn(voteEventModel, "findManyVoteEvents");
  });

  it("should return all vote events for an external voter", async () => {
    const mockVoteEvents = [
      MOCK_VOTE_EVENT_1_WITH_ID,
      MOCK_VOTE_EVENT_2_WITH_ID,
    ];
    findManyVoteEventsSpy.mockResolvedValueOnce(mockVoteEvents);

    const result = await getExternalVoterVoteEvents(VOTER_ID_1);

    expect(result).toEqual(
      mockVoteEvents.map((ve) => {
        return {
          ...ve,
          voterManagement: { ...voteEventHelper.DEFAULT_REGISTRATION_PERIOD },
        };
      })
    );
    expect(findManyVoteEventsSpy).toHaveBeenCalledTimes(1);
    expect(findManyVoteEventsSpy).toHaveBeenCalledWith({
      where: {
        externalVoters: { some: { id: VOTER_ID_1 } },
        voterManagement: { isNot: null },
        voteConfig: { isNot: null },
      },
      include: VOTE_EVENT_PUBLIC_INCLUSION,
    });
  });

  it("should return an empty array if no vote events found", async () => {
    findManyVoteEventsSpy.mockResolvedValueOnce([]);

    const result = await getExternalVoterVoteEvents(VOTER_ID_1);

    expect(result).toEqual([]);
    expect(findManyVoteEventsSpy).toHaveBeenCalledTimes(1);
  });
});

describe("getOneVoteEventById helper unit test", () => {
  let findUniqueVoteEventSpy;

  beforeAll(() => {
    findUniqueVoteEventSpy = jest.spyOn(voteEventModel, "findUniqueVoteEvent");
  });

  it("should return a vote event when found", async () => {
    const mockVoteEvent = { ...MOCK_VOTE_EVENT_1_WITH_ID };
    findUniqueVoteEventSpy.mockResolvedValueOnce(mockVoteEvent);

    const result = await getOneVoteEventById(MOCK_VOTE_EVENT_1_WITH_ID.id);

    expect(result).toEqual(mockVoteEvent);
    expect(findUniqueVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(findUniqueVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
      include: VOTE_EVENT_INCLUSION,
    });
  });

  it("should throw SkylabError with bad request status code when vote event not found", async () => {
    findUniqueVoteEventSpy.mockRejectedValue(
      new SkylabError("Vote event was not found", HttpStatusCode.BAD_REQUEST)
    );

    await expect(getOneVoteEventById(NON_EXISTENT_ID)).rejects.toThrowError(
      SkylabError
    );
    await expect(getOneVoteEventById(NON_EXISTENT_ID)).rejects.toThrowError(
      "Vote event was not found"
    );

    expect(findUniqueVoteEventSpy).toHaveBeenCalledTimes(2);
    expect(findUniqueVoteEventSpy).toHaveBeenCalledWith({
      where: { id: NON_EXISTENT_ID },
      include: VOTE_EVENT_INCLUSION,
    });
  });
});

describe("createVoteEvent helper unit test", () => {
  let createVoteEventSpy;

  beforeAll(() => {
    createVoteEventSpy = jest.spyOn(voteEventModel, "createOneVoteEvent");
  });

  it("should successfully create a vote event", async () => {
    const mockCreatedVoteEvent = {
      ...MOCK_VOTE_EVENT_1_WITH_ID,
      resultsFilter: { ...DEFAULT_RESULTS_FILTER },
    };

    createVoteEventSpy.mockResolvedValueOnce(mockCreatedVoteEvent);

    const result = await voteEventHelper.createVoteEvent({
      voteEvent: {
        ...MOCK_VOTE_EVENT_1,
      },
    });

    expect(result).toEqual(mockCreatedVoteEvent);
    expect(createVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(createVoteEventSpy).toHaveBeenCalledWith({
      data: {
        ...MOCK_VOTE_EVENT_1,
        resultsFilter: { create: { ...DEFAULT_RESULTS_FILTER } },
      },
    });
  });
});

describe("editVoteEvent helper unit test", () => {
  let updateVoteEventSpy;
  let findUniqueVoteEventSpy;

  beforeAll(() => {
    updateVoteEventSpy = jest.spyOn(voteEventModel, "updateVoteEvent");
    findUniqueVoteEventSpy = jest.spyOn(voteEventModel, "findUniqueVoteEvent");
  });

  it("should successfully update a vote event", async () => {
    const mockUpdatedVoteEvent = {
      ...MOCK_VOTE_EVENT_1_WITH_ID,
      ...MOCK_UPDATED_VOTE_EVENT_1,
      resultsFilter: { ...DEFAULT_RESULTS_FILTER },
    };

    updateVoteEventSpy.mockResolvedValueOnce(mockUpdatedVoteEvent);
    findUniqueVoteEventSpy.mockResolvedValueOnce(MOCK_VOTE_EVENT_1_WITH_ID);

    const result = await editVoteEvent({
      body: {
        voteEvent: {
          ...MOCK_UPDATED_VOTE_EVENT_1,
          resultsFilter: { ...DEFAULT_RESULTS_FILTER },
        },
      },
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    expect(result).toEqual(mockUpdatedVoteEvent);
    expect(findUniqueVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(findUniqueVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
      include: { voterManagement: true },
    });
    expect(updateVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(updateVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
      data: {
        ...MOCK_UPDATED_VOTE_EVENT_1,
        voterManagement: undefined,
        voteConfig: undefined,
        resultsFilter: { update: { ...DEFAULT_RESULTS_FILTER } },
      },
      include: VOTE_EVENT_INCLUSION,
    });
  });

  it("should throw SkylabError with bad request status code when vote event is not found", async () => {
    findUniqueVoteEventSpy.mockResolvedValueOnce(null);

    await expect(
      editVoteEvent({
        body: {
          voteEvent: {
            ...MOCK_UPDATED_VOTE_EVENT_1,
            resultsFilter: { ...DEFAULT_RESULTS_FILTER },
          },
        },
        voteEventId: NON_EXISTENT_ID,
      })
    ).rejects.toThrowError(
      new SkylabError("Vote event was not found", HttpStatusCode.BAD_REQUEST)
    );

    expect(findUniqueVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(findUniqueVoteEventSpy).toHaveBeenCalledWith({
      where: { id: NON_EXISTENT_ID },
      include: { voterManagement: true },
    });
    expect(updateVoteEventSpy).toHaveBeenCalledTimes(0);
  });
});

describe("removeVoteEvent helper unit test", () => {
  let deleteVoteEventSpy;

  beforeAll(() => {
    deleteVoteEventSpy = jest.spyOn(voteEventModel, "deleteVoteEvent");
  });

  it("should successfully delete a vote event", async () => {
    deleteVoteEventSpy.mockResolvedValueOnce(MOCK_VOTE_EVENT_1_WITH_ID);

    await removeVoteEvent(MOCK_VOTE_EVENT_1_WITH_ID.id);

    expect(deleteVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(deleteVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
    });
  });
});

// --- End of Vote Event Helper Functions Tests ---

// --- Internal Voter Helper Functions Tests ---

describe("getAllInternalVotersByVoteEvent helper unit test", () => {
  let findManyUsersSpy;

  beforeAll(() => {
    findManyUsersSpy = jest.spyOn(userModel, "findManyUsers");
  });

  it("should successfully retrieve all internal voters by vote event ID", async () => {
    const MOCK_INTERNAL_VOTERS = [
      {
        ...removePasswordFromUser(MOCK_USER_1),
        voteEvents: [{ id: MOCK_VOTE_EVENT_1_WITH_ID.id }],
        administrator: {},
        mentor: {},
        adviser: {},
        student: {},
      },
    ];
    findManyUsersSpy.mockResolvedValueOnce(MOCK_INTERNAL_VOTERS);

    const result = await getAllInternalVotersByVoteEvent(
      MOCK_VOTE_EVENT_1_WITH_ID.id
    );

    expect(result).toEqual(MOCK_INTERNAL_VOTERS);
    expect(findManyUsersSpy).toHaveBeenCalledTimes(1);
    expect(findManyUsersSpy).toHaveBeenCalledWith({
      where: { voteEvents: { some: { id: MOCK_VOTE_EVENT_1_WITH_ID.id } } },
      include: {
        student: true,
        mentor: true,
        administrator: true,
        adviser: true,
      },
    });
  });

  it("should return an empty array if no internal voters found", async () => {
    findManyUsersSpy.mockResolvedValueOnce([]);

    const result = await getAllInternalVotersByVoteEvent(
      MOCK_VOTE_EVENT_1_WITH_ID.id
    );

    expect(result).toEqual([]);
    expect(findManyUsersSpy).toHaveBeenCalledTimes(1);
    expect(findManyUsersSpy).toHaveBeenCalledWith({
      where: { voteEvents: { some: { id: MOCK_VOTE_EVENT_1_WITH_ID.id } } },
      include: {
        student: true,
        mentor: true,
        administrator: true,
        adviser: true,
      },
    });
  });
});

describe("addInternalVoter helper unit test", () => {
  let updateUniqueUserSpy;
  let findManyUsersSpy;
  const mockUpdatedUser = {
    ...MOCK_USER_1,
    voteEvents: [{ id: MOCK_VOTE_EVENT_1_WITH_ID }],
  };

  beforeAll(() => {
    updateUniqueUserSpy = jest.spyOn(userModel, "updateUniqueUser");
    findManyUsersSpy = jest.spyOn(userModel, "findManyUsers");
  });

  it("should successfully add a voter to a vote event", async () => {
    updateUniqueUserSpy.mockResolvedValueOnce(mockUpdatedUser);
    findManyUsersSpy.mockResolvedValueOnce([mockUpdatedUser]);
    findManyUsersSpy.mockResolvedValueOnce([]);

    const result = await addInternalVoter({
      body: { email: MOCK_USER_1.email },
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    expect(result).toEqual({
      ...removePasswordFromUser(mockUpdatedUser),
      administrator: {},
      mentor: {},
      adviser: {},
      student: {},
    });
    expect(updateUniqueUserSpy).toHaveBeenCalledTimes(1);
    expect(updateUniqueUserSpy).toHaveBeenCalledWith({
      where: { email: MOCK_USER_1.email },
      data: {
        voteEvents: {
          connect: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
        },
      },
      include: {
        student: true,
        mentor: true,
        administrator: true,
        adviser: true,
      },
    });
    expect(findManyUsersSpy).toHaveBeenCalledTimes(2);
    expect(findManyUsersSpy).toHaveBeenCalledWith({
      where: {
        email: MOCK_USER_1.email,
        voteEvents: { some: { id: MOCK_VOTE_EVENT_1_WITH_ID.id } },
      },
    });
  });

  it("should throw SkylabError when the user is already part of the vote event", async () => {
    const mockUser = mockUpdatedUser;
    findManyUsersSpy.mockResolvedValueOnce([mockUser]);
    findManyUsersSpy.mockResolvedValueOnce([mockUser]);

    await expect(
      addInternalVoter({
        body: { email: MOCK_USER_1.email },
        voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
      })
    ).rejects.toThrowError(
      new SkylabError(
        "User is already part of the vote event",
        HttpStatusCode.BAD_REQUEST
      )
    );

    expect(updateUniqueUserSpy).toHaveBeenCalledTimes(0);
  });

  it("should throw SkylabError when the user (email) does not exist", async () => {
    updateUniqueUserSpy.mockRejectedValueOnce({ code: "P2016" });
    findManyUsersSpy.mockResolvedValueOnce([]);

    await expect(
      addInternalVoter({
        body: { email: NON_EXISTENT_USER_EMAIL },
        voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
      })
    ).rejects.toThrowError(
      new SkylabError("User does not exist", HttpStatusCode.BAD_REQUEST)
    );

    expect(updateUniqueUserSpy).toHaveBeenCalledTimes(0);
  });
});

describe("addManyInternalVoters helper unit test", () => {
  let findManyUsersSpy;
  let updateVoteEventSpy;

  beforeAll(() => {
    findManyUsersSpy = jest.spyOn(userModel, "findManyUsers");
    updateVoteEventSpy = jest.spyOn(voteEventModel, "updateVoteEvent");
  });

  it("should successfully add many voters to a vote event", async () => {
    findManyUsersSpy.mockResolvedValueOnce([MOCK_USER_1]);
    updateVoteEventSpy.mockResolvedValueOnce({
      ...MOCK_VOTE_EVENT_1_WITH_ID,
      internalVoters: [MOCK_USER_1],
    });

    const result = await addManyInternalVoters({
      body: { emails: [MOCK_USER_1.email] },
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    expect(result).toEqual([formatUserWithRoleData(MOCK_USER_1)]);
    expect(findManyUsersSpy).toHaveBeenCalledTimes(1);
    expect(findManyUsersSpy).toHaveBeenCalledWith({
      where: { email: { in: [MOCK_USER_1.email] } },
    });
    expect(updateVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(updateVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
      data: {
        internalVoters: {
          connect: [{ id: MOCK_USER_1.id }],
        },
      },
      include: {
        internalVoters: {
          include: {
            student: true,
            mentor: true,
            administrator: true,
            adviser: true,
          },
        },
      },
    });
  });

  it("should throw SkylabError when one or more users do not exist", async () => {
    findManyUsersSpy.mockResolvedValueOnce([]);
    updateVoteEventSpy.mockResolvedValueOnce(MOCK_VOTE_EVENT_1_WITH_ID);

    await expect(
      addManyInternalVoters({
        body: { emails: [NON_EXISTENT_USER_EMAIL] },
        voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
      })
    ).rejects.toThrowError(
      new SkylabError(
        "One or more users do not exist",
        HttpStatusCode.BAD_REQUEST
      )
    );

    expect(updateVoteEventSpy).toHaveBeenCalledTimes(0);
  });
});

describe("removeInternalVoter helper unit test", () => {
  let transactionSpy;

  beforeAll(() => {
    transactionSpy = jest.spyOn(prisma, "$transaction");
  });

  it("should successfully remove a voter from a vote event", async () => {
    const mockUpdatedUser = {
      ...MOCK_USER_1,
      voteEvents: [],
    };

    transactionSpy.mockResolvedValueOnce(mockUpdatedUser);

    const result = await removeInternalVoter(
      MOCK_VOTE_EVENT_1_WITH_ID.id,
      MOCK_USER_1.id
    );

    expect(result).toEqual(mockUpdatedUser);
    expect(transactionSpy).toHaveBeenCalledTimes(1);
  });
});

// --- End of Internal Voter Helper Functions Tests ---

// --- External Voter Helper Functions Tests ---

describe("getAllExternalVotersByVoteEvent helper unit test", () => {
  let findManyExternalVotersSpy;

  beforeAll(() => {
    findManyExternalVotersSpy = jest.spyOn(
      voteEventModel,
      "findManyExternalVoters"
    );
  });

  it("should return all external voters for a vote event", async () => {
    const mockExternalVoters = [MOCK_EXTERNAL_VOTER_1, MOCK_EXTERNAL_VOTER_2];

    findManyExternalVotersSpy.mockResolvedValueOnce(mockExternalVoters);

    const result = await getAllExternalVotersByVoteEvent(
      MOCK_VOTE_EVENT_1_WITH_ID.id
    );

    expect(result).toEqual(mockExternalVoters);
    expect(findManyExternalVotersSpy).toHaveBeenCalledTimes(1);
    expect(findManyExternalVotersSpy).toHaveBeenCalledWith({
      where: { voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id },
    });
  });

  it("should return an empty array if no external voters are found", async () => {
    findManyExternalVotersSpy.mockResolvedValueOnce([]);

    const result = await getAllExternalVotersByVoteEvent(
      MOCK_VOTE_EVENT_1_WITH_ID.id
    );

    expect(result).toEqual([]);
    expect(findManyExternalVotersSpy).toHaveBeenCalledTimes(1);
    expect(findManyExternalVotersSpy).toHaveBeenCalledWith({
      where: { voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id },
    });
  });
});

describe("addExternalVoter helper unit test", () => {
  let createExternalVoterSpy;
  let findManyExternalVotersSpy;

  beforeAll(() => {
    createExternalVoterSpy = jest.spyOn(voteEventModel, "createExternalVoter");
    findManyExternalVotersSpy = jest.spyOn(
      voteEventModel,
      "findManyExternalVoters"
    );
  });

  it("should successfully add an external voter to a vote event", async () => {
    createExternalVoterSpy.mockResolvedValueOnce(MOCK_EXTERNAL_VOTER_1);
    findManyExternalVotersSpy.mockResolvedValueOnce([]);

    const result = await addExternalVoter({
      body: { voterId: MOCK_EXTERNAL_VOTER_1.id },
      voteEventId: MOCK_EXTERNAL_VOTER_1.voteEventId,
    });

    expect(result).toEqual(MOCK_EXTERNAL_VOTER_1);
    expect(createExternalVoterSpy).toHaveBeenCalledTimes(1);
    expect(createExternalVoterSpy).toHaveBeenCalledWith({
      data: {
        id: MOCK_EXTERNAL_VOTER_1.id,
        voteEventId: MOCK_EXTERNAL_VOTER_1.voteEventId,
      },
    });
    expect(findManyExternalVotersSpy).toHaveBeenCalledTimes(1);
    expect(findManyExternalVotersSpy).toHaveBeenCalledWith({
      where: {
        id: MOCK_EXTERNAL_VOTER_1.id,
        voteEventId: MOCK_EXTERNAL_VOTER_1.voteEventId,
      },
    });
  });

  it("should throw SkylabError when external voter is already part of the vote event", async () => {
    findManyExternalVotersSpy.mockResolvedValueOnce([MOCK_EXTERNAL_VOTER_1]);

    await expect(
      addExternalVoter({
        body: { voterId: MOCK_EXTERNAL_VOTER_1.id },
        voteEventId: MOCK_EXTERNAL_VOTER_1.voteEventId,
      })
    ).rejects.toThrowError(
      new SkylabError(
        "External voter is already part of the vote event",
        HttpStatusCode.BAD_REQUEST
      )
    );

    expect(createExternalVoterSpy).toHaveBeenCalledTimes(0);
  });
});

describe("addManyExternalVoters helper unit test", () => {
  let createManyExternalVotersSpy;
  let findManyExternalVotersSpy;

  beforeAll(() => {
    createManyExternalVotersSpy = jest.spyOn(
      voteEventModel,
      "createManyExternalVoters"
    );
    findManyExternalVotersSpy = jest.spyOn(
      voteEventModel,
      "findManyExternalVoters"
    );
  });

  it("should successfully add many external voters to a vote event", async () => {
    const mockExternalVoters = [MOCK_EXTERNAL_VOTER_1, MOCK_EXTERNAL_VOTER_2];
    const mockVoterIds = mockExternalVoters.map((voter) => voter.id);

    findManyExternalVotersSpy.mockResolvedValueOnce([]);
    createManyExternalVotersSpy.mockResolvedValueOnce(mockExternalVoters);
    findManyExternalVotersSpy.mockResolvedValueOnce(mockExternalVoters);

    const result = await addManyExternalVoters({
      body: { voterIds: mockVoterIds },
      voteEventId: MOCK_VOTE_EVENT_2_WITH_ID.id,
    });

    expect(result).toEqual(mockExternalVoters);
    expect(createManyExternalVotersSpy).toHaveBeenCalledTimes(1);
    expect(createManyExternalVotersSpy).toHaveBeenCalledWith({
      data: mockVoterIds.map((voterId) => ({
        id: voterId,
        voteEventId: MOCK_VOTE_EVENT_2_WITH_ID.id,
      })),
    });
    expect(findManyExternalVotersSpy).toHaveBeenCalledTimes(2);
    expect(findManyExternalVotersSpy).toHaveBeenNthCalledWith(1, {
      where: {
        id: { in: mockVoterIds },
        voteEventId: MOCK_VOTE_EVENT_2_WITH_ID.id,
      },
    });
    expect(findManyExternalVotersSpy).toHaveBeenNthCalledWith(2, {
      where: { voteEventId: MOCK_VOTE_EVENT_2_WITH_ID.id },
    });
  });
});

describe("generateExternalVoters helper unit test", () => {
  let findManyExternalVotersSpy;
  let createManyExternalVotersSpy;

  beforeAll(() => {
    findManyExternalVotersSpy = jest.spyOn(
      voteEventModel,
      "findManyExternalVoters"
    );
    createManyExternalVotersSpy = jest.spyOn(
      voteEventModel,
      "createManyExternalVoters"
    );
  });

  it("should successfully generate external voters for a vote event", async () => {
    const mockExternalVoters = [MOCK_EXTERNAL_VOTER_1, MOCK_EXTERNAL_VOTER_2];

    findManyExternalVotersSpy.mockResolvedValueOnce(mockExternalVoters);
    findManyExternalVotersSpy.mockResolvedValueOnce(mockExternalVoters);

    const result = await generateExternalVoters({
      body: {
        amount: 1,
        length: 6,
      },
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    expect(result).toEqual(mockExternalVoters);
    expect(findManyExternalVotersSpy).toHaveBeenCalledTimes(2);
    expect(findManyExternalVotersSpy).toHaveBeenNthCalledWith(1, {
      where: { voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id },
    });
    expect(findManyExternalVotersSpy).toHaveBeenNthCalledWith(2, {
      where: { voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id },
    });
    expect(createManyExternalVotersSpy).toHaveBeenCalledTimes(1);
    expect(createManyExternalVotersSpy).toHaveBeenCalledWith({
      data: [
        {
          id: expect.any(String),
          voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
        },
      ],
    });
  });
});

describe("removeExternalVoter helper unit test", () => {
  let deleteExternalVoterSpy;

  beforeAll(() => {
    deleteExternalVoterSpy = jest.spyOn(voteEventModel, "deleteExternalVoter");
  });

  it("should successfully remove an external voter from a vote event", async () => {
    deleteExternalVoterSpy.mockResolvedValueOnce(MOCK_EXTERNAL_VOTER_1);

    await removeExternalVoter(
      MOCK_EXTERNAL_VOTER_1.voteEventId,
      MOCK_EXTERNAL_VOTER_1.id
    );

    expect(deleteExternalVoterSpy).toHaveBeenCalledTimes(1);
    expect(deleteExternalVoterSpy).toHaveBeenCalledWith({
      where: {
        id_voteEventId: {
          id: MOCK_EXTERNAL_VOTER_1.id,
          voteEventId: MOCK_EXTERNAL_VOTER_1.voteEventId,
        },
      },
    });
  });
});

// --- End of External Voter Helper Functions Tests ---

// --- Candidate Helper Functions Tests ---

describe("getAllCandidatesByVoteEvent helper unit test", () => {
  let findManyProjectsSpy;

  beforeAll(() => {
    findManyProjectsSpy = jest.spyOn(projectModel, "findManyProjects");
  });

  it("should return all candidates for a vote event", async () => {
    const mockProjects = [MOCK_PROJECT_1_WITH_ID, MOCK_PROJECT_2_WITH_ID];

    findManyProjectsSpy.mockResolvedValueOnce(mockProjects);

    const result = await getAllCandidatesByVoteEvent(
      MOCK_VOTE_EVENT_1_WITH_ID.id
    );

    expect(result).toEqual(mockProjects);
    expect(findManyProjectsSpy).toHaveBeenCalledTimes(1);
    expect(findManyProjectsSpy).toHaveBeenCalledWith({
      where: { voteEvents: { some: { id: MOCK_VOTE_EVENT_1_WITH_ID.id } } },
    });
  });
});

describe("addCandidate helper unit test", () => {
  let findManyProjectsSpy;
  let updateOneProjectSpy;
  const addCandidateParams = {
    body: { projectId: MOCK_PROJECT_1_WITH_ID.id },
    voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
  };

  beforeAll(() => {
    findManyProjectsSpy = jest.spyOn(projectModel, "findManyProjects");
    updateOneProjectSpy = jest.spyOn(projectModel, "updateOneProject");
  });

  it("should add a candidate to a vote event", async () => {
    findManyProjectsSpy.mockResolvedValueOnce([]);
    updateOneProjectSpy.mockResolvedValueOnce(MOCK_PROJECT_1_WITH_ID);

    const result = await addCandidate(addCandidateParams);

    expect(result).toEqual(MOCK_PROJECT_1_WITH_ID);
    expect(findManyProjectsSpy).toHaveBeenCalledTimes(1);
    expect(findManyProjectsSpy).toHaveBeenCalledWith({
      where: {
        id: MOCK_PROJECT_1_WITH_ID.id,
        voteEvents: { some: { id: MOCK_VOTE_EVENT_1_WITH_ID.id } },
      },
    });
    expect(updateOneProjectSpy).toHaveBeenCalledTimes(1);
    expect(updateOneProjectSpy).toHaveBeenCalledWith({
      where: { id: MOCK_PROJECT_1_WITH_ID.id },
      data: {
        voteEvents: {
          connect: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
        },
      },
    });
  });

  it("should throw an error a project already part of the vote event", async () => {
    findManyProjectsSpy.mockResolvedValueOnce([MOCK_PROJECT_1_WITH_ID]);

    await expect(addCandidate(addCandidateParams)).rejects.toThrowError(
      new SkylabError(
        "Project is already part of the vote event",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

  it("should throw an error if the project to update does not exist", async () => {
    findManyProjectsSpy.mockResolvedValueOnce([]);
    updateOneProjectSpy.mockRejectedValueOnce({ code: "P2016" });

    await expect(
      addCandidate({
        body: { projectId: MOCK_PROJECT_1_WITH_ID.id },
        voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
      })
    ).rejects.toThrowError(
      new SkylabError("Project ID does not exist", HttpStatusCode.BAD_REQUEST)
    );
  });
});

describe("addManyCandidates helper unit test", () => {
  let findManyProjectsSpy;
  let updateVoteEventSpy;
  const addManyCandidatesParams = {
    body: {
      cohort: MOCK_PROJECT_1_WITH_ID.cohortYear,
      achievement: MOCK_PROJECT_1_WITH_ID.achievement,
    },
    voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
  };

  beforeAll(() => {
    findManyProjectsSpy = jest.spyOn(projectModel, "findManyProjects");
    updateVoteEventSpy = jest.spyOn(voteEventModel, "updateVoteEvent");
  });

  it("should add many candidates to a vote event", async () => {
    const MOCK_VOTE_EVENT_1_WITH_ID_WITH_CANDIDATES = {
      ...MOCK_VOTE_EVENT_1_WITH_ID,
      candidates: [MOCK_PROJECT_1_WITH_ID],
    };

    findManyProjectsSpy.mockResolvedValueOnce([MOCK_PROJECT_1_WITH_ID]);
    updateVoteEventSpy.mockResolvedValueOnce(
      MOCK_VOTE_EVENT_1_WITH_ID_WITH_CANDIDATES
    );

    const result = await addManyCandidates(addManyCandidatesParams);

    expect(result).toEqual(
      MOCK_VOTE_EVENT_1_WITH_ID_WITH_CANDIDATES.candidates
    );
    expect(findManyProjectsSpy).toHaveBeenCalledTimes(1);
    expect(findManyProjectsSpy).toHaveBeenCalledWith({
      where: {
        cohortYear: MOCK_PROJECT_1_WITH_ID.cohortYear,
        achievement: MOCK_PROJECT_1_WITH_ID.achievement,
      },
    });
    expect(updateVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(updateVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
      data: {
        candidates: {
          connect: [{ id: MOCK_PROJECT_1_WITH_ID.id }],
        },
      },
      include: { candidates: true },
    });
  });
});

describe("removeCandidate helper unit test", () => {
  let transactionSpy;
  let findUniqueVoteEventSpy;

  beforeAll(() => {
    transactionSpy = jest.spyOn(prisma, "$transaction");
    findUniqueVoteEventSpy = jest.spyOn(voteEventModel, "findUniqueVoteEvent");
  });

  it("should remove one candidate from a vote event", async () => {
    transactionSpy.mockResolvedValueOnce(MOCK_PROJECT_1_WITH_ID);
    findUniqueVoteEventSpy.mockResolvedValueOnce({
      ...MOCK_VOTE_EVENT_1_WITH_ID,
      voteConfig: MOCK_VOTE_CONFIG,
      _count: { candidates: 10 },
    });

    const result = await removeCandidate(
      MOCK_VOTE_EVENT_1_WITH_ID.id,
      MOCK_PROJECT_1_WITH_ID.id
    );

    expect(result).toEqual(MOCK_PROJECT_1_WITH_ID);
    expect(transactionSpy).toHaveBeenCalledTimes(1);
  });
});

describe("getVotesByVoteEventAndVoter helper unit test", () => {
  let findManyVotesSpy;

  beforeAll(() => {
    findManyVotesSpy = jest.spyOn(voteEventModel, "findManyVotes");
  });

  it("should get votes by vote event and voter", async () => {
    const mockVotes = [
      { projectId: MOCK_PROJECT_1_WITH_ID.id },
      { projectId: MOCK_PROJECT_2_WITH_ID.id },
    ];
    findManyVotesSpy.mockResolvedValueOnce(mockVotes);

    const result = await getVotesByVoteEventAndVoter(
      MOCK_VOTE_EVENT_1_WITH_ID.id,
      MOCK_USER_1.id
    );

    expect(findManyVotesSpy).toHaveBeenCalledTimes(1);
    expect(findManyVotesSpy).toHaveBeenCalledWith({
      where: {
        voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
        userId: MOCK_USER_1.id,
        externalVoterId: undefined,
      },
      select: { projectId: true },
    });
    expect(result).toEqual(mockVotes);
  });
});

describe("getAllVotesByVoteEvent helper unit test", () => {
  let findManyVotesSpy;

  beforeAll(() => {
    findManyVotesSpy = jest.spyOn(voteEventModel, "findManyVotes");
  });

  it("should get all votes by vote event", async () => {
    const mockVotes = [];
    findManyVotesSpy.mockResolvedValueOnce(mockVotes);

    const result = await getAllVotesByVoteEvent(MOCK_VOTE_EVENT_1_WITH_ID.id);

    expect(findManyVotesSpy).toHaveBeenCalledTimes(1);
    expect(findManyVotesSpy).toHaveBeenCalledWith({
      where: { voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id },
      include: {
        internalVoter: {
          include: {
            student: true,
            mentor: true,
            administrator: true,
            adviser: true,
          },
        },
        project: true,
      },
    });
    expect(result).toEqual(mockVotes);
  });
});

describe("addManyVotes helper unit test", () => {
  let createManyVotesSpy;
  let findManyVotesSpy;
  let findUniqueVoteEventSpy;
  const voteEventWithConfig = {
    ...MOCK_VOTE_EVENT_1_WITH_ID,
    voteConfig: {
      ...MOCK_VOTE_CONFIG,
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    },
    startTime: new Date(Date.now() - 10000),
    endTime: new Date(Date.now() + 10000),
    candidates: [
      {
        id: MOCK_PROJECT_1_WITH_ID.id,
      },
      {
        id: MOCK_PROJECT_2_WITH_ID.id,
      },
    ],
  };

  beforeAll(() => {
    createManyVotesSpy = jest.spyOn(voteEventModel, "createManyVotes");
    findManyVotesSpy = jest.spyOn(voteEventModel, "findManyVotes");
    findUniqueVoteEventSpy = jest.spyOn(voteEventModel, "findUniqueVoteEvent");
  });

  it("should add many votes and return them", async () => {
    const mockVotes = [
      { projectId: MOCK_PROJECT_1_WITH_ID.id },
      { projectId: MOCK_PROJECT_2_WITH_ID.id },
    ];
    createManyVotesSpy.mockResolvedValueOnce([]);
    findManyVotesSpy.mockResolvedValueOnce([]);
    findManyVotesSpy.mockResolvedValueOnce(mockVotes);
    findManyVotesSpy.mockResolved;
    findUniqueVoteEventSpy.mockResolvedValueOnce(voteEventWithConfig);

    const results = await addManyVotes({
      body: {
        userId: MOCK_USER_1.id,
        projectIds: [MOCK_PROJECT_1_WITH_ID.id, MOCK_PROJECT_2_WITH_ID.id],
      },
      voteEventId: MOCK_VOTE_EVENT_2_WITH_ID.id,
    });

    expect(findManyVotesSpy).toBeCalledTimes(2);
    expect(findManyVotesSpy).toHaveBeenNthCalledWith(1, {
      where: {
        voteEventId: MOCK_VOTE_EVENT_2_WITH_ID.id,
        userId: MOCK_USER_1.id,
        externalVoterId: undefined,
      },
    });
    expect(findManyVotesSpy).toHaveBeenNthCalledWith(2, {
      where: {
        voteEventId: MOCK_VOTE_EVENT_2_WITH_ID.id,
        userId: MOCK_USER_1.id,
        externalVoterId: undefined,
      },
      select: { projectId: true },
    });

    expect(findUniqueVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(findUniqueVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_2_WITH_ID.id },
      include: {
        voteConfig: true,
        candidates: {
          select: { id: true },
        },
      },
    });

    expect(createManyVotesSpy).toHaveBeenCalledTimes(1);
    expect(createManyVotesSpy).toHaveBeenCalledWith({
      data: [
        {
          userId: MOCK_USER_1.id,
          projectId: MOCK_PROJECT_1_WITH_ID.id,
          voteEventId: MOCK_VOTE_EVENT_2_WITH_ID.id,
          externalVoterId: undefined,
        },
        {
          userId: MOCK_USER_1.id,
          projectId: MOCK_PROJECT_2_WITH_ID.id,
          voteEventId: MOCK_VOTE_EVENT_2_WITH_ID.id,
          externalVoterId: undefined,
        },
      ],
    });

    expect(results).toEqual(mockVotes);
  });

  it("should throw an error if no IDs are provided", async () => {
    await expect(
      addManyVotes({
        body: { projectIds: [] },
        voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
      })
    ).rejects.toThrowError(
      new SkylabError(
        "You are not authorized to vote in this event",
        HttpStatusCode.UNAUTHORIZED
      )
    );
  });

  it("should throw an error if votes already exist", async () => {
    findManyVotesSpy.mockResolvedValueOnce([MOCK_VOTE_1]);

    await expect(
      addManyVotes({
        body: { userId: MOCK_USER_1.id, projectIds: [] },
        voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
      })
    ).rejects.toThrowError(
      new SkylabError(
        "You have already voted in this event",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

  it("should throw an error if the vote event does not exist", async () => {
    findManyVotesSpy.mockResolvedValueOnce([]);
    findUniqueVoteEventSpy.mockResolvedValueOnce(null);

    await expect(
      addManyVotes({
        body: { userId: MOCK_USER_1.id, projectIds: [] },
        voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
      })
    ).rejects.toThrowError(
      new SkylabError("Vote event does not exist", HttpStatusCode.BAD_REQUEST)
    );
  });

  it("should throw an error if the vote config is not set", async () => {
    findManyVotesSpy.mockResolvedValueOnce([]);
    findUniqueVoteEventSpy.mockResolvedValueOnce(MOCK_VOTE_EVENT_1_WITH_ID);

    await expect(
      addManyVotes({
        body: { userId: MOCK_USER_1.id, projectIds: [] },
        voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
      })
    ).rejects.toThrowError(
      new SkylabError(
        "Vote event setup is not complete",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

  it("should throw an error if the vote event is not open", async () => {
    findManyVotesSpy.mockResolvedValueOnce([]);
    findUniqueVoteEventSpy.mockResolvedValueOnce({
      ...voteEventWithConfig,
      startTime: new Date(Date.now() + 10000),
    });

    await expect(
      addManyVotes({
        body: { userId: MOCK_USER_1.id, projectIds: [] },
        voteEventId: MOCK_VOTE_EVENT_2_WITH_ID.id,
      })
    ).rejects.toThrowError(
      new SkylabError("Vote event is not open", HttpStatusCode.BAD_REQUEST)
    );
  });

  it("should throw an error if number of votes exceeds the maximum votes", async () => {
    findManyVotesSpy.mockResolvedValueOnce([]);
    findUniqueVoteEventSpy.mockResolvedValueOnce(voteEventWithConfig);

    await expect(
      addManyVotes({
        body: { userId: MOCK_USER_1.id, projectIds: [1, 2, 3, 4, 5] },
        voteEventId: MOCK_VOTE_EVENT_2_WITH_ID.id,
      })
    ).rejects.toThrowError(
      new SkylabError(
        "Number of votes is not within the minimum and maximum limit",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

  it("should throw an error if number of votes is below the minimum votes", async () => {
    findManyVotesSpy.mockResolvedValueOnce([]);
    findUniqueVoteEventSpy.mockResolvedValueOnce(voteEventWithConfig);

    await expect(
      addManyVotes({
        body: { userId: MOCK_USER_1.id, projectIds: [] },
        voteEventId: MOCK_VOTE_EVENT_2_WITH_ID.id,
      })
    ).rejects.toThrowError(
      new SkylabError(
        "Number of votes is not within the minimum and maximum limit",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

  it("should throw an error if project IDs are not candidates", async () => {
    findManyVotesSpy.mockResolvedValueOnce([]);
    findUniqueVoteEventSpy.mockResolvedValueOnce(voteEventWithConfig);

    await expect(
      addManyVotes({
        body: {
          userId: MOCK_USER_1.id,
          projectIds: [MOCK_VOTE_EVENT_2_WITH_ID.id, 3, 4],
        },
        voteEventId: MOCK_VOTE_EVENT_2_WITH_ID.id,
      })
    ).rejects.toThrowError(
      new SkylabError(
        "The following ids are not valid: 3, 4",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });
});

describe("removeVote helper unit test", () => {
  let deleteVoteSpy;
  const MOCK_VOTE_1_ID = 1;

  beforeAll(() => {
    deleteVoteSpy = jest.spyOn(voteEventModel, "deleteVote");
  });

  it("should remove a vote", async () => {
    deleteVoteSpy.mockResolvedValueOnce(MOCK_VOTE_1);

    const result = await removeVote(MOCK_VOTE_1_ID);

    expect(deleteVoteSpy).toHaveBeenCalledTimes(1);
    expect(deleteVoteSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_1_ID },
    });
    expect(result).toEqual(MOCK_VOTE_1);
  });
});

describe("getResultsByVoteEvent helper unit test", () => {
  let findUniqueVoteEventSpy;
  let findManyVotesSpy;
  let calculateResultsSpy;

  beforeAll(() => {
    findUniqueVoteEventSpy = jest.spyOn(voteEventModel, "findUniqueVoteEvent");
    findManyVotesSpy = jest.spyOn(voteEventModel, "findManyVotes");
    calculateResultsSpy = jest.spyOn(voteEventHelper, "calculateResults");
  });

  it("should get results by vote event", async () => {
    const publishedResultsFilter = {
      ...DEFAULT_RESULTS_FILTER,
      areResultsPublished: true,
    };
    const mockVoteEvent = {
      ...MOCK_VOTE_EVENT_1_WITH_ID,
      resultsFilter: publishedResultsFilter,
    };
    const mockVotes = [];
    const mockResults = [];

    findUniqueVoteEventSpy.mockResolvedValueOnce(mockVoteEvent);
    findManyVotesSpy.mockResolvedValueOnce(mockVotes);
    calculateResultsSpy.mockReturnValueOnce(mockResults);

    const result = await getResultsByVoteEvent(MOCK_VOTE_EVENT_1_WITH_ID.id);

    expect(findUniqueVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(findUniqueVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
      include: {
        resultsFilter: true,
      },
    });
    expect(findManyVotesSpy).toHaveBeenCalledTimes(1);
    expect(findManyVotesSpy).toHaveBeenCalledWith({
      where: { voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id },
      include: {
        internalVoter: {
          include: {
            student: true,
            mentor: true,
            administrator: true,
            adviser: true,
          },
        },
        project: true,
      },
    });
    expect(calculateResultsSpy).toHaveBeenCalledTimes(1);
    expect(calculateResultsSpy).toHaveBeenCalledWith(
      mockVotes,
      publishedResultsFilter
    );
    expect(result).toEqual(mockResults);
  });

  it("should throw an error if the vote event does not exist", async () => {
    findUniqueVoteEventSpy.mockResolvedValueOnce(null);

    await expect(
      getResultsByVoteEvent(MOCK_VOTE_EVENT_1_WITH_ID.id)
    ).rejects.toThrowError(
      new SkylabError("Vote event does not exist", HttpStatusCode.BAD_REQUEST)
    );
  });

  it("should throw an error if vote event has not started", async () => {
    const mockVoteEvent = {
      ...MOCK_VOTE_EVENT_1_WITH_ID,
      startTime: new Date(Date.now() + 10000),
    };

    findUniqueVoteEventSpy.mockResolvedValueOnce(mockVoteEvent);

    await expect(
      getResultsByVoteEvent(MOCK_VOTE_EVENT_1_WITH_ID.id)
    ).rejects.toThrowError(
      new SkylabError("Vote event has not started", HttpStatusCode.BAD_REQUEST)
    );
  });

  it("should throw an error if results are not published", async () => {
    const mockVoteEvent = {
      ...MOCK_VOTE_EVENT_1_WITH_ID,
      resultsFilter: {
        ...DEFAULT_RESULTS_FILTER,
        areResultsPublished: false,
      },
    };

    findUniqueVoteEventSpy.mockResolvedValueOnce(mockVoteEvent);

    await expect(
      getResultsByVoteEvent(MOCK_VOTE_EVENT_1_WITH_ID.id)
    ).rejects.toThrowError(
      new SkylabError("Results are not published", HttpStatusCode.BAD_REQUEST)
    );
  });
});

describe("editVoterManagement helper unit test", () => {
  let transactionSpy;

  beforeAll(() => {
    transactionSpy = jest.spyOn(prisma, "$transaction");
  });

  it("should edit voter management", async () => {
    const mockUpdatedVoteEvent = {
      ...MOCK_VOTE_EVENT_1_WITH_ID,
      voterManagement: {
        ...MOCK_VOTER_MANAGEMENT,
        voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
      },
    };

    transactionSpy.mockResolvedValueOnce(mockUpdatedVoteEvent);

    const result = await editVoterManagement({
      body: {
        voterManagement: MOCK_VOTER_MANAGEMENT,
      },
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    expect(result).toEqual(mockUpdatedVoteEvent);
    expect(transactionSpy).toHaveBeenCalledTimes(1);
    expect(transactionSpy).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should copy internal voters from another vote event", async () => {
    const mockInternalVoters = [MOCK_USER_1];
    const mockUpdatedVoteEvent = {
      ...MOCK_VOTE_EVENT_1_WITH_ID,
      internalVoters: mockInternalVoters,
    };

    transactionSpy.mockResolvedValueOnce(mockUpdatedVoteEvent);

    const result = await editVoterManagement({
      body: {
        voterManagement: {
          ...MOCK_VOTER_MANAGEMENT,
          copyInternalVoteEventId: MOCK_VOTE_EVENT_2_WITH_ID.id,
        },
      },
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    expect(result).toEqual(mockUpdatedVoteEvent);
    expect(transactionSpy).toHaveBeenCalledTimes(1);
    expect(transactionSpy).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should copy external voters from another vote event", async () => {
    const mockExternalVoters = [MOCK_EXTERNAL_VOTER_1];
    const mockUpdatedVoteEvent = {
      ...MOCK_VOTE_EVENT_1_WITH_ID,
      externalVoters: mockExternalVoters,
    };

    transactionSpy.mockResolvedValueOnce(mockUpdatedVoteEvent);

    const result = await editVoterManagement({
      body: {
        voterManagement: {
          ...MOCK_VOTER_MANAGEMENT,
          copyExternalVoteEventId: MOCK_VOTE_EVENT_2_WITH_ID.id,
        },
      },
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    expect(result).toEqual(mockUpdatedVoteEvent);
    expect(transactionSpy).toHaveBeenCalledTimes(1);
    expect(transactionSpy).toHaveBeenCalledWith(expect.any(Function));
  });
});
