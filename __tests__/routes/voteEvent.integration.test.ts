/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { AchievementLevel, ExternalVoter } from "@prisma/client";
import {
  MOCK_PROJECT_1,
  MOCK_VOTER_MANAGEMENT,
  MOCK_VOTE_CONFIG,
  MOCK_VOTE_EVENT_1,
  MOCK_VOTE_EVENT_2,
  NON_EXISTENT_ID,
  NON_EXISTENT_USER_EMAIL,
  VOTER_ID_1,
  VOTER_ID_2,
} from "../../__mocks__/voteEvent.mocks";
import { prisma } from "../../src/client";
import * as voteEventHelpers from "../../src/helpers/voteEvent.helper";
import {
  KNOWN_EMAILS,
  setUpRequestWithAdminAuth,
  setUpRequestWithExternalVoterAuth,
  setUpRequestWithStudentAuth,
  voteEventTestSetUp,
  voteEventTestTearDown,
} from "../../src/utils/testUtils";

const BASE_URL = "/api/vote-events";

let mockVoteEvent1Id;
let mockVoteEvent2Id;
let mockProject1Id;
let mockProject2Id;
let userIds;
let request;
let requestWithStudentAuth;
let requestWithExternalVoterAuth;

beforeAll(async () => {
  await voteEventTestSetUp(); // need to run once before you can get the external voter auth
  request = await setUpRequestWithAdminAuth();
  requestWithStudentAuth = await setUpRequestWithStudentAuth();
  requestWithExternalVoterAuth = await setUpRequestWithExternalVoterAuth();
  await voteEventTestTearDown();

  return request;
});

beforeEach(async () => {
  const result = await voteEventTestSetUp();

  mockVoteEvent1Id = result.voteEvent1Id;
  mockVoteEvent2Id = result.voteEvent2Id;
  mockProject1Id = result.mockProject1Id;
  mockProject2Id = result.mockProject2Id;
  userIds = result.userIds;

  return result;
});

afterEach(async () => {
  return await voteEventTestTearDown();
});

// --- Vote event API tests ---

describe("GET / endpoint", () => {
  let voteEventsWithISOStrings: any[] = [];

  beforeEach(async () => {
    voteEventsWithISOStrings = [
      {
        ...MOCK_VOTE_EVENT_1,
        id: mockVoteEvent1Id,
        voteConfig: MOCK_VOTE_CONFIG,
        voterManagement: {
          isRegistrationOpen: MOCK_VOTER_MANAGEMENT.isRegistrationOpen,
        },
        resultsFilter: {
          areResultsPublished: true,
        },
      },
      {
        ...MOCK_VOTE_EVENT_2,
        id: mockVoteEvent2Id,
        voteConfig: null,
        voterManagement: null,
        resultsFilter: {
          areResultsPublished: false,
        },
      },
    ].map((event) => ({
      ...event,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
    }));
  });

  it("should return all vote events for an administrator", async () => {
    const response = await request.get(BASE_URL + "/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ voteEvents: voteEventsWithISOStrings });
  });

  it("should return all vote events for an internal voter", async () => {
    const response = await requestWithStudentAuth.get(BASE_URL + "/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      voteEvents: [
        voteEventsWithISOStrings.map((voteEvent) => {
          return {
            ...voteEvent,
            voterManagement: {
              isRegistrationOpen: expect.any(Boolean),
            },
          };
        })[0],
      ],
    });
  });

  it("should return all vote events for an external voter", async () => {
    const response = await requestWithExternalVoterAuth.get(BASE_URL + "/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      voteEvents: [
        voteEventsWithISOStrings.map((voteEvent) => {
          return {
            ...voteEvent,
            voterManagement: {
              isRegistrationOpen: false,
            },
          };
        })[0],
      ],
    });
  });
});

describe("POST / endpoint", () => {
  const newVoteEvent = {
    title: "New Vote Event",
    startTime: new Date("2024-06-01"),
    endTime: new Date("2024-06-30"),
  };

  it("should create a new vote event with valid request body", async () => {
    const response = await request
      .post(BASE_URL + "/")
      .send({ voteEvent: newVoteEvent });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("voteEvent");
    const { voteEvent } = response.body;
    expect(voteEvent).toHaveProperty("id");
    expect(voteEvent.title).toBe(newVoteEvent.title);
    expect(voteEvent.startTime).toEqual(newVoteEvent.startTime.toISOString());
    expect(voteEvent.endTime).toEqual(newVoteEvent.endTime.toISOString());

    // Verify the vote event was actually deleted from the database
    const dbCheck = await prisma.voteEvent.findUnique({
      where: { id: voteEvent.id },
    });
    expect(dbCheck).toBeDefined();
  });

  it("should return 400 with invalid request body", async () => {
    const invalidVoteEvent = {
      // Missing required properties
    };

    const response = await request
      .post(BASE_URL + "/")
      .send({ voteEvent: invalidVoteEvent });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Request arguments failed validation checks"
    );
  });

  it("should handle errors during vote event creation", async () => {
    // Mocking the createVoteEvent function to throw an error
    const createVoteEvent = jest.spyOn(voteEventHelpers, "createVoteEvent");
    createVoteEvent.mockRejectedValueOnce(new Error("Database error"));

    const response = await request
      .post(BASE_URL + "/")
      .send({ voteEvent: newVoteEvent });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    createVoteEvent.mockRestore();
  });
});

describe("GET /:voteEventId endpoint", () => {
  it("should return a vote event for a given vote event ID", async () => {
    const response = await request.get(`${BASE_URL}/${mockVoteEvent1Id}`);

    const expectedVoteEvent = {
      ...MOCK_VOTE_EVENT_1,
      id: mockVoteEvent1Id,
      voteConfig: MOCK_VOTE_CONFIG,
      voterManagement: MOCK_VOTER_MANAGEMENT,
      resultsFilter: {
        ...voteEventHelpers.DEFAULT_RESULTS_FILTER,
        areResultsPublished: true,
      },
      startTime: MOCK_VOTE_EVENT_1.startTime.toISOString(),
      endTime: MOCK_VOTE_EVENT_1.endTime.toISOString(),
    };

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("voteEvent");
    const { voteEvent } = response.body;
    expect(voteEvent).toEqual(expectedVoteEvent);
  });

  it("should only return public fields for non administartors", async () => {
    const response = await requestWithStudentAuth.get(
      `${BASE_URL}/${mockVoteEvent1Id}`
    );

    const expectedVoteEvent = {
      ...MOCK_VOTE_EVENT_1,
      id: mockVoteEvent1Id,
      voteConfig: MOCK_VOTE_CONFIG,
      voterManagement: {
        isRegistrationOpen: false,
      },
      resultsFilter: {
        areResultsPublished: true,
      },
      startTime: MOCK_VOTE_EVENT_1.startTime.toISOString(),
      endTime: MOCK_VOTE_EVENT_1.endTime.toISOString(),
    };

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("voteEvent");
    const { voteEvent } = response.body;
    expect(voteEvent).toEqual(expectedVoteEvent);
  });

  it("should return 400 if the vote event does not exist", async () => {
    const response = await request.get(`${BASE_URL}/${NON_EXISTENT_ID}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Vote event was not found" });
  });

  it("should handle errors during vote event retrieval", async () => {
    const getVoteEventByIdMock = jest
      .spyOn(voteEventHelpers, "getOneVoteEventById")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request.get(`${BASE_URL}/${mockVoteEvent1Id}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    getVoteEventByIdMock.mockRestore();
  });
});

describe("PUT /:voteEventId endpoint", () => {
  const updatedVoteEvent = {
    title: "Updated Event",
    startTime: new Date(),
    endTime: new Date(),
  };

  it("should edit existing general settings for a given vote event", async () => {
    const response = await request
      .put(`${BASE_URL}/${mockVoteEvent2Id}`)
      .send({ voteEvent: updatedVoteEvent });

    const expectedVoteEvent = {
      ...updatedVoteEvent,
      id: mockVoteEvent2Id,
      resultsFilter: voteEventHelpers.DEFAULT_RESULTS_FILTER,
      startTime: updatedVoteEvent.startTime.toISOString(),
      endTime: updatedVoteEvent.endTime.toISOString(),
      voteConfig: null,
      voterManagement: null,
    };

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("voteEvent");
    const { voteEvent } = response.body;
    expect(voteEvent).toEqual(expectedVoteEvent);

    // Verify the vote event was actually updated in the database
    const dbCheck = await prisma.voteEvent.findUnique({
      where: { id: mockVoteEvent2Id },
      include: voteEventHelpers.VOTE_EVENT_INCLUSION,
    });
    expect(dbCheck).not.toBeNull();
    if (!dbCheck) return;
    expect(dbCheck).toEqual({
      ...expectedVoteEvent,
      startTime: new Date(expectedVoteEvent.startTime),
      endTime: new Date(expectedVoteEvent.endTime),
    });
  });

  it("should edit existing voter management for a given vote event", async () => {
    const updatedVoterManagement = {
      hasInternalList: true,
      hasExternalList: true,
      isRegistrationOpen: true,
    };

    const response = await request.put(`${BASE_URL}/${mockVoteEvent1Id}`).send({
      voteEvent: {
        ...MOCK_VOTE_EVENT_1,
        voterManagement: updatedVoterManagement,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("voteEvent");
    const { voteEvent } = response.body;
    expect(voteEvent.voterManagement).toEqual(updatedVoterManagement);

    // Verify the voter management was actually updated in the database
    const dbCheck = await prisma.voteEvent.findUnique({
      where: { id: mockVoteEvent1Id },
      include: { voterManagement: true },
    });
    expect(dbCheck).not.toBeNull();
    if (!dbCheck) return;
    expect(dbCheck.voterManagement).toEqual({
      ...updatedVoterManagement,
      voteEventId: mockVoteEvent1Id,
    });

    // Verify all internal and external voters were not removed
    const internalVoters = await prisma.user.findMany({
      where: { voteEvents: { some: { id: mockVoteEvent1Id } } },
    });
    expect(internalVoters).toHaveLength(KNOWN_EMAILS.length);

    const externalVoters = await prisma.externalVoter.findMany({
      where: { voteEventId: mockVoteEvent1Id },
    });
    expect(externalVoters).toHaveLength(2);
  });

  it("should be able to edit vote config for a given vote event", async () => {
    const updatedVoteConfig = {
      ...MOCK_VOTE_CONFIG,
      maxVotes: 3,
    };

    const response = await request.put(`${BASE_URL}/${mockVoteEvent1Id}`).send({
      voteEvent: { ...MOCK_VOTE_EVENT_1, voteConfig: updatedVoteConfig },
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("voteEvent");
    const { voteEvent } = response.body;
    expect(voteEvent.voteConfig).toEqual(updatedVoteConfig);

    // Verify the vote event was actually updated in the database
    const dbCheck = await prisma.voteEvent.findUnique({
      where: { id: mockVoteEvent1Id },
      include: { voteConfig: true },
    });
    expect(dbCheck).not.toBeNull();
    if (!dbCheck) return;
    expect(dbCheck.voteConfig).toEqual({
      ...updatedVoteConfig,
      voteEventId: mockVoteEvent1Id,
    });
  });

  it("should return 400 if the vote event does not exist", async () => {
    const response = await request
      .put(`${BASE_URL}/${NON_EXISTENT_ID}`)
      .send({ voteEvent: updatedVoteEvent });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 400 with invalid request body", async () => {
    const invalidVoteEvent = {
      title: {}, // Invalid type
    };

    const response = await request
      .put(`${BASE_URL}/${mockVoteEvent1Id}`)
      .send({ voteEvent: invalidVoteEvent });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Request arguments failed validation checks"
    );
  });

  it("should handle errors during vote event update", async () => {
    const editVoteEventMock = jest
      .spyOn(voteEventHelpers, "editVoteEvent")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request
      .put(`${BASE_URL}/${mockVoteEvent1Id}`)
      .send({ voteEvent: updatedVoteEvent });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    editVoteEventMock.mockRestore();
  });
});

describe("PUT /:voteEventId/voter-management endpoint", () => {
  const updatedVoterManagement = {
    hasInternalList: true,
    hasExternalList: true,
    isRegistrationOpen: true,
  };

  it("should set voter management for the first time", async () => {
    const response = await request
      .put(`${BASE_URL}/${mockVoteEvent2Id}/voter-management`)
      .send({ voterManagement: updatedVoterManagement });

    const expectedVoteEvent = {
      ...MOCK_VOTE_EVENT_2,
      id: mockVoteEvent2Id,
      voterManagement: updatedVoterManagement,
      resultsFilter: {
        ...voteEventHelpers.DEFAULT_RESULTS_FILTER,
        areResultsPublished: false,
      },
      startTime: MOCK_VOTE_EVENT_2.startTime.toISOString(),
      endTime: MOCK_VOTE_EVENT_2.endTime.toISOString(),
      voteConfig: null,
    };

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("voteEvent");
    const { voteEvent } = response.body;
    expect(voteEvent).toEqual(expectedVoteEvent);

    // Verify the vote event was actually updated in the database
    const dbCheck = await prisma.voteEvent.findUnique({
      where: { id: mockVoteEvent2Id },
      include: voteEventHelpers.VOTE_EVENT_INCLUSION,
    });
    expect(dbCheck).not.toBeNull();
    if (!dbCheck) return;
    expect(dbCheck).toEqual({
      ...expectedVoteEvent,
      startTime: new Date(expectedVoteEvent.startTime),
      endTime: new Date(expectedVoteEvent.endTime),
    });
  });

  it("should edit existing voter management for a given vote event and remove all old voters", async () => {
    const response = await request
      .put(`${BASE_URL}/${mockVoteEvent1Id}/voter-management`)
      .send({ voterManagement: updatedVoterManagement });

    const expectedVoteEvent = {
      ...MOCK_VOTE_EVENT_1,
      id: mockVoteEvent1Id,
      voterManagement: updatedVoterManagement,
      resultsFilter: {
        ...voteEventHelpers.DEFAULT_RESULTS_FILTER,
        areResultsPublished: true,
      },
      startTime: MOCK_VOTE_EVENT_1.startTime.toISOString(),
      endTime: MOCK_VOTE_EVENT_1.endTime.toISOString(),
      voteConfig: MOCK_VOTE_CONFIG,
    };

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("voteEvent");
    const { voteEvent } = response.body;
    expect(voteEvent).toEqual(expectedVoteEvent);

    // Verify the vote event was actually updated in the database
    const dbCheck = await prisma.voteEvent.findUnique({
      where: { id: mockVoteEvent1Id },
      include: voteEventHelpers.VOTE_EVENT_INCLUSION,
    });
    expect(dbCheck).not.toBeNull();
    if (!dbCheck) return;
    expect(dbCheck).toEqual({
      ...expectedVoteEvent,
      startTime: new Date(expectedVoteEvent.startTime),
      endTime: new Date(expectedVoteEvent.endTime),
    });

    // Verify all internal and external voters were removed
    const internalVoters = await prisma.user.findMany({
      where: { voteEvents: { some: { id: mockVoteEvent1Id } } },
    });
    expect(internalVoters).toHaveLength(0);

    const externalVoters = await prisma.externalVoter.findMany({
      where: { voteEventId: mockVoteEvent1Id },
    });
    expect(externalVoters).toHaveLength(0);
  });
});

describe("DELETE /:voteEventId endpoint", () => {
  it("should delete an existing vote event", async () => {
    const response = await request.delete(`${BASE_URL}/${mockVoteEvent1Id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("voteEvent");
    const { voteEvent } = response.body;
    expect(voteEvent.id).toBe(mockVoteEvent1Id);
    expect(voteEvent.title).toBe(MOCK_VOTE_EVENT_1.title);
    expect(new Date(voteEvent.startTime)).toEqual(MOCK_VOTE_EVENT_1.startTime);
    expect(new Date(voteEvent.endTime)).toEqual(MOCK_VOTE_EVENT_1.endTime);

    // Verify the vote event was actually deleted from the database
    const dbCheck = await prisma.voteEvent.findUnique({
      where: { id: mockVoteEvent1Id },
    });
    expect(dbCheck).toBeNull();
  });

  it("should return 400 if the vote event does not exist", async () => {
    const response = await request.delete(`${BASE_URL}/${NON_EXISTENT_ID}`);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should handle errors during vote event deletion", async () => {
    const removeVoteEventMock = jest
      .spyOn(voteEventHelpers, "removeVoteEvent")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request.delete(`${BASE_URL}/${mockVoteEvent1Id}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    removeVoteEventMock.mockRestore();
  });
});

// --- End of vote event API tests ---

// --- Internal voter API tests ---

describe("POST /:voteEventId/register endpoint", () => {
  it("should register an internal voter for a given vote event", async () => {
    const response = await requestWithStudentAuth.post(
      `${BASE_URL}/${mockVoteEvent2Id}/register`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("voteEvent");
    const { voteEvent } = response.body;
    expect(voteEvent.id).toBe(mockVoteEvent2Id);
    expect(voteEvent.title).toBe(MOCK_VOTE_EVENT_2.title);
    expect(new Date(voteEvent.startTime)).toEqual(MOCK_VOTE_EVENT_2.startTime);
    expect(new Date(voteEvent.endTime)).toEqual(MOCK_VOTE_EVENT_2.endTime);

    // Verify the internal voter was actually added to the database
    const dbCheck = await prisma.user.findUnique({
      where: { email: KNOWN_EMAILS[0] },
      include: { voteEvents: true },
    });
    expect(dbCheck).not.toBeNull();
    if (!dbCheck) return;
    expect(dbCheck.voteEvents).toContainEqual(
      expect.objectContaining({ id: mockVoteEvent2Id })
    );
  });

  it("should return 400 if the internal voter is already registered", async () => {
    const response = await requestWithStudentAuth.post(
      `${BASE_URL}/${mockVoteEvent1Id}/register`
    );

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should handle errors during internal voter registration", async () => {
    const addInternalVoterMock = jest
      .spyOn(voteEventHelpers, "addInternalVoter")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await requestWithStudentAuth.post(
      `${BASE_URL}/${mockVoteEvent2Id}/register`
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    addInternalVoterMock.mockRestore();
  });
});

describe("GET /:voteEventId/voter-management/internal-voters endpoint", () => {
  it("should return all internal voters for a given vote event", async () => {
    const response = await request.get(
      `${BASE_URL}/${mockVoteEvent1Id}/voter-management/internal-voters`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("internalVoters");
    const { internalVoters } = response.body;
    expect(internalVoters).toHaveLength(KNOWN_EMAILS.length);
    expect(internalVoters).toEqual(
      expect.arrayContaining([
        ...KNOWN_EMAILS.map((email) => expect.objectContaining({ email })),
      ])
    );
  });

  it("should return an empty array if the vote event does not exist", async () => {
    const response = await request.get(
      `${BASE_URL}/${NON_EXISTENT_ID}/voter-management/internal-voters`
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ internalVoters: [] });
  });

  it("should handle errors during internal voters retrieval", async () => {
    const getAllInternalVotersByVoteEventMock = jest
      .spyOn(voteEventHelpers, "getAllInternalVotersByVoteEvent")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request.get(
      `${BASE_URL}/${mockVoteEvent1Id}/voter-management/internal-voters`
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    getAllInternalVotersByVoteEventMock.mockRestore();
  });
});

describe("POST /:voteEventId/voter-management/internal-voters endpoint", () => {
  it("should add a new internal voter to a given vote event", async () => {
    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent2Id}/voter-management/internal-voters`)
      .send({ email: KNOWN_EMAILS[0] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("internalVoter");
    const { internalVoter } = response.body;
    expect(internalVoter).toHaveProperty("id");
    expect(internalVoter.email).toBe(KNOWN_EMAILS[0]);

    // Verify the internal voter was actually added to the database
    const dbCheck = await prisma.user.findUnique({
      where: { id: internalVoter.id },
    });
    expect(dbCheck).not.toBeNull();
    if (!dbCheck) return;
    expect(dbCheck.email).toBe(KNOWN_EMAILS[0]);
  });

  it("should return 400 if request tries to add a duplicate internal voter", async () => {
    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent1Id}/voter-management/internal-voters`)
      .send({ email: KNOWN_EMAILS[0] });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "User is already part of the vote event"
    );
  });

  it("should return 400 with invalid request body", async () => {
    const invalidRequest = {
      // Missing required fields
    };

    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent2Id}/voter-management/internal-voters`)
      .send(invalidRequest);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Request arguments failed validation checks"
    );
  });

  it("should handle errors during internal voter addition", async () => {
    const addInternalVoterMock = jest
      .spyOn(voteEventHelpers, "addInternalVoter")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent2Id}/voter-management/internal-voters`)
      .send({ email: KNOWN_EMAILS[0] });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    addInternalVoterMock.mockRestore();
  });
});

describe("POST /:voteEventId/voter-management/internal-voters/batch endpoint", () => {
  it("should add multiple internal voters to a given vote event", async () => {
    const body = {
      emails: [KNOWN_EMAILS[0], KNOWN_EMAILS[1]],
    };

    const response = await request
      .post(
        `${BASE_URL}/${mockVoteEvent2Id}/voter-management/internal-voters/batch`
      )
      .send(body);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("internalVoters");
    const { internalVoters: addedInternalVoters } = response.body;
    expect(addedInternalVoters).toHaveLength(2);
    expect(addedInternalVoters).toEqual(
      expect.arrayContaining(
        body.emails.map((email) => expect.objectContaining({ email }))
      )
    );

    // Verify the internal voters were actually added to the database
    const dbCheck = await prisma.user.findMany({
      where: {
        email: { in: KNOWN_EMAILS },
        voteEvents: { some: { id: mockVoteEvent2Id } },
      },
    });
    expect(dbCheck).toHaveLength(2);
    expect(dbCheck).toEqual(
      expect.arrayContaining(
        body.emails.map((email) => expect.objectContaining({ email }))
      )
    );
  });

  it("should return 400 if one or more user do not exist", async () => {
    const body = {
      emails: [KNOWN_EMAILS[0], NON_EXISTENT_USER_EMAIL],
    };

    const response = await request
      .post(
        `${BASE_URL}/${mockVoteEvent2Id}/voter-management/internal-voters/batch`
      )
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "One or more users do not exist",
    });
  });

  it("should handle errors during internal voter addition", async () => {
    const addManyInternalVotersMock = jest
      .spyOn(voteEventHelpers, "addManyInternalVoters")
      .mockRejectedValueOnce(new Error("Database error"));

    const internalVoters = [
      { email: KNOWN_EMAILS[0] },
      { email: KNOWN_EMAILS[1] },
    ];

    const response = await request
      .post(
        `${BASE_URL}/${mockVoteEvent2Id}/voter-management/internal-voters/batch`
      )
      .send(internalVoters);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    addManyInternalVotersMock.mockRestore();
  });
});

describe("DELETE /:voteEventId/voter-management/internal-voters/:internalVoterId endpoint", () => {
  let idToDelete;

  beforeAll(async () => {
    const internalVoter = await prisma.user.findUnique({
      where: { email: KNOWN_EMAILS[0] },
    });

    if (!internalVoter) {
      throw new Error("Internal voter not found");
    }

    idToDelete = internalVoter.id;
    return idToDelete;
  });

  it("should delete an internal voter from a given vote event", async () => {
    const response = await request.delete(
      `${BASE_URL}/${mockVoteEvent1Id}/voter-management/internal-voters/${idToDelete}`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("internalVoter");
    const { internalVoter } = response.body;
    expect(internalVoter.id).toBe(idToDelete);
    expect(internalVoter.email).toBe(KNOWN_EMAILS[0]);

    // Verify the internal voter was actually removed from vote event
    const dbCheck = await prisma.user.findUnique({
      where: { id: internalVoter.id },
      include: { voteEvents: true },
    });
    const voteEvents = dbCheck?.voteEvents || [];
    expect(voteEvents).not.toContainEqual(
      expect.objectContaining({ id: mockVoteEvent1Id })
    );
  });

  it("should return 400 if the internal voter does not exist", async () => {
    const response = await request.delete(
      `${BASE_URL}/${mockVoteEvent1Id}/voter-management/internal-voters/${NON_EXISTENT_ID}`
    ); // Non-existent internal voter ID

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should return user without the vote event if the vote event does not exist", async () => {
    const response = await request.delete(
      `${BASE_URL}/${NON_EXISTENT_ID}/voter-management/internal-voters/${idToDelete}`
    ); // Non-existent vote event ID

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("internalVoter");
    const { internalVoter } = response.body;
    expect(internalVoter.id).toBe(idToDelete);
    expect(internalVoter.email).toBe(KNOWN_EMAILS[0]);
    expect(internalVoter.voteEvents).not.toContainEqual(
      expect.objectContaining({ id: NON_EXISTENT_ID })
    );
  });

  it("should handle errors during internal voter deletion", async () => {
    const removeInternalVoterMock = jest
      .spyOn(voteEventHelpers, "removeInternalVoter")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request.delete(
      `${BASE_URL}/${mockVoteEvent1Id}/voter-management/internal-voters/${idToDelete}`
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    removeInternalVoterMock.mockRestore();
  });
});

// --- End of internal voter API tests ---

// --- External voter API tests ---

describe("GET /:voteEventId/voter-management/external-voters endpoint", () => {
  it("should return all external voters for a given vote event", async () => {
    const response = await request.get(
      `${BASE_URL}/${mockVoteEvent1Id}/voter-management/external-voters`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("externalVoters");
    const { externalVoters } = response.body;
    expect(externalVoters).toHaveLength(2);
    expect(externalVoters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: VOTER_ID_1,
          voteEventId: mockVoteEvent1Id,
        }),
        expect.objectContaining({
          id: VOTER_ID_2,
          voteEventId: mockVoteEvent1Id,
        }),
      ])
    );
  });

  it("should return empty array if the vote event does not exist", async () => {
    const response = await request.get(
      `${BASE_URL}/${NON_EXISTENT_ID}/voter-management/external-voters`
    ); // Non-existent vote event ID

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ externalVoters: [] });
  });

  it("should handle errors during retrieval of external voters", async () => {
    const getAllExternalVotersByVoteEventMock = jest
      .spyOn(voteEventHelpers, "getAllExternalVotersByVoteEvent")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request.get(
      `${BASE_URL}/${mockVoteEvent1Id}/voter-management/external-voters`
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    getAllExternalVotersByVoteEventMock.mockRestore();
  });
});

describe("POST /:voteEventId/voter-management/external-voters endpoint", () => {
  it("should create a new external voter for a given vote event", async () => {
    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent2Id}/voter-management/external-voters`)
      .send({
        voterId: { id: VOTER_ID_1, voteEventId: mockVoteEvent1Id }.id,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("externalVoter");
    const { externalVoter } = response.body;
    expect(externalVoter.id).toBe(
      { id: VOTER_ID_1, voteEventId: mockVoteEvent1Id }.id
    );
    expect(externalVoter.voteEventId).toBe(mockVoteEvent2Id);

    // Verify the external voter was actually created in the database
    const dbCheck = await prisma.externalVoter.findUnique({
      where: {
        id_voteEventId: {
          id: { id: VOTER_ID_1, voteEventId: mockVoteEvent1Id }.id,
          voteEventId: mockVoteEvent2Id,
        },
      },
    });
    expect(dbCheck).not.toBeNull();
    if (!dbCheck) return;
    expect(dbCheck.id).toBe(
      { id: VOTER_ID_1, voteEventId: mockVoteEvent1Id }.id
    );
    expect(dbCheck?.voteEventId).toBe(mockVoteEvent2Id);
  });

  it("should return 400 if the external voter already exists", async () => {
    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent1Id}/voter-management/external-voters`)
      .send({
        voterId: { id: VOTER_ID_1, voteEventId: mockVoteEvent1Id }.id,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 400 with invalid request body", async () => {
    const invalidExternalVoter = {
      // Missing required properties
    };

    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent2Id}/voter-management/external-voters`)
      .send(invalidExternalVoter);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Request arguments failed validation checks"
    );
  });

  it("should handle errors during external voter creation", async () => {
    const addExternalVoterMock = jest
      .spyOn(voteEventHelpers, "addExternalVoter")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent2Id}/voter-management/external-voters`)
      .send({
        voterId: { id: VOTER_ID_1, voteEventId: mockVoteEvent1Id }.id,
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    addExternalVoterMock.mockRestore();
  });
});

describe("POST /:voteEventId/voter-management/external-voters/batch endpoint", () => {
  const externalVoters = [
    { id: VOTER_ID_1, voteEventId: mockVoteEvent1Id },
    { id: VOTER_ID_2, voteEventId: mockVoteEvent1Id },
    { id: "newID", voteEventId: mockVoteEvent1Id },
  ];

  it("should add multiple external voters to a given vote event", async () => {
    const body = {
      voterIds: [
        externalVoters[0].id,
        externalVoters[1].id,
        externalVoters[2].id,
      ],
    };

    const response = await request
      .post(
        `${BASE_URL}/${mockVoteEvent1Id}/voter-management/external-voters/batch`
      )
      .send(body);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("externalVoters");
    const { externalVoters: addedExternalVoters } = response.body;
    expect(addedExternalVoters).toHaveLength(3);
    addedExternalVoters.forEach((voter: ExternalVoter) => {
      expect(voter.voteEventId).toBe(mockVoteEvent1Id);
    });
    expect(addedExternalVoters.map((voter) => voter.id)).toEqual(
      expect.arrayContaining(externalVoters.map((voter) => voter.id))
    );

    // Verify the external voters were actually added to the database
    const dbCheck = await prisma.externalVoter.findMany({
      where: { voteEventId: mockVoteEvent1Id },
    });
    expect(dbCheck).toHaveLength(3);
    dbCheck.forEach((voter: ExternalVoter) => {
      expect(voter.voteEventId).toBe(mockVoteEvent1Id);
    });
    expect(dbCheck.map((voter) => voter.id)).toEqual(
      expect.arrayContaining(externalVoters.map((voter) => voter.id))
    );
  });

  it("should handle errors during external voter addition", async () => {
    const addManyExternalVotersMock = jest
      .spyOn(voteEventHelpers, "addManyExternalVoters")
      .mockRejectedValueOnce(new Error("Database error"));

    const body = {
      voterIds: [
        externalVoters[0].id,
        externalVoters[1].id,
        externalVoters[2].id,
      ],
    };

    const response = await request
      .post(
        `${BASE_URL}/${mockVoteEvent2Id}/voter-management/external-voters/batch`
      )
      .send(body);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    addManyExternalVotersMock.mockRestore();
  });
});

describe("POST /:voteEventId/voter-management/external-voters/generate endpoint", () => {
  const body = { amount: 10, length: 8 };

  it("should generate external voters for a given vote event", async () => {
    const response = await request
      .post(
        `${BASE_URL}/${mockVoteEvent2Id}/voter-management/external-voters/generate`
      )
      .send(body);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("externalVoters");
    const { externalVoters } = response.body;
    expect(externalVoters).toHaveLength(body.amount);
    //expect each external voter object to have id field of length 8
    externalVoters.forEach((voter: ExternalVoter) => {
      expect(voter.id).toHaveLength(body.length);
      expect(voter.voteEventId).toBe(mockVoteEvent2Id);
    });

    // Verify the external voters were actually added to the database
    const dbCheck = await prisma.externalVoter.findMany({
      where: { voteEventId: mockVoteEvent2Id },
    });
    expect(dbCheck).toHaveLength(body.amount);
    externalVoters.forEach((voter: ExternalVoter) => {
      expect(voter.id).toHaveLength(body.length);
      expect(voter.voteEventId).toBe(mockVoteEvent2Id);
    });
  });

  it("should handle errors during external voter generation", async () => {
    const generateExternalVotersMock = jest
      .spyOn(voteEventHelpers, "generateExternalVoters")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request
      .post(
        `${BASE_URL}/${mockVoteEvent1Id}/voter-management/external-voters/generate`
      )
      .send(body);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    generateExternalVotersMock.mockRestore();
  });
});

describe("DELETE /:voteEventId/voter-management/external-voters/:externalVoterId endpoint", () => {
  it("should delete an external voter for a given vote event", async () => {
    const response = await request.delete(
      `${BASE_URL}/${mockVoteEvent1Id}/voter-management/external-voters/${
        { id: VOTER_ID_1, voteEventId: mockVoteEvent1Id }.id
      }`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("externalVoter");
    const { externalVoter } = response.body;
    expect(externalVoter.id).toBe(
      { id: VOTER_ID_1, voteEventId: mockVoteEvent1Id }.id
    );
    expect(externalVoter.voteEventId).toBe(mockVoteEvent1Id);

    // Verify the external voter was actually deleted from the database
    const dbCheck = await prisma.externalVoter.findUnique({
      where: {
        id_voteEventId: {
          id: { id: VOTER_ID_1, voteEventId: mockVoteEvent1Id }.id,
          voteEventId: mockVoteEvent1Id,
        },
      },
    });
    expect(dbCheck).toBeNull();
  });

  it("should return 400 if the external voter does not exist", async () => {
    const response = await request.delete(
      `${BASE_URL}/${mockVoteEvent1Id}/voter-management/external-voters/nonexistent`
    );

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should handle errors during external voter deletion", async () => {
    const removeExternalVoterMock = jest
      .spyOn(voteEventHelpers, "removeExternalVoter")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request.delete(
      `${BASE_URL}/${mockVoteEvent1Id}/voter-management/external-voters/${
        { id: VOTER_ID_1, voteEventId: mockVoteEvent1Id }.id
      }`
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    removeExternalVoterMock.mockRestore();
  });
});

// --- End of external voter API tests ---

describe("GET /:voteEventId/candidates", () => {
  it("should return all candidates for a given vote event", async () => {
    const response = await request.get(
      `${BASE_URL}/${mockVoteEvent1Id}/candidates`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("candidates");
    expect(response.body.candidates).toHaveLength(2);
  });

  it("should return an empty array if the vote event does not exist", async () => {
    const response = await request.get(
      `${BASE_URL}/${NON_EXISTENT_ID}/candidates`
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ candidates: [] });
  });

  it("should handle errors during candidate retrieval", async () => {
    const getVoteEventCandidatesMock = jest
      .spyOn(voteEventHelpers, "getAllCandidatesByVoteEvent")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request.get(
      `${BASE_URL}/${mockVoteEvent1Id}/candidates`
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    getVoteEventCandidatesMock.mockRestore();
  });
});

describe("POST /:voteEventId/candidates", () => {
  it("should add a new candidate to a given vote event", async () => {
    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent2Id}/candidates`)
      .send({ projectId: mockProject1Id });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("candidate");
    const { candidate } = response.body;
    expect(candidate).toHaveProperty("id");
    expect(candidate.name).toBe(MOCK_PROJECT_1.name);

    // Verify the candidate was actually added to the database
    const dbCheck = await prisma.project.findUnique({
      where: { id: candidate.id },
    });
    expect(dbCheck).not.toBeNull();
    if (!dbCheck) return;
    expect(dbCheck).toEqual(expect.objectContaining(MOCK_PROJECT_1));
  });

  it("should return 400 if the candidate is already part of the vote event", async () => {
    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent1Id}/candidates`)
      .send({ projectId: mockProject1Id });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Project is already part of the vote event",
    });
  });

  it("should return 400 if the project does not exist", async () => {
    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent2Id}/candidates`)
      .send({ projectId: NON_EXISTENT_ID });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Project ID does not exist" });
  });

  it("should return 400 with invalid request body", async () => {
    const invalidRequest = {
      // Missing required fields
    };

    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent2Id}/candidates`)
      .send(invalidRequest);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Request arguments failed validation checks"
    );
  });

  it("should handle errors during candidate addition", async () => {
    const addCandidateMock = jest
      .spyOn(voteEventHelpers, "addCandidate")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent2Id}/candidates`)
      .send({ projectId: mockProject1Id });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    addCandidateMock.mockRestore();
  });
});

describe("POST /:voteEventId/candidates/batch", () => {
  const requestBody = {
    cohort: MOCK_PROJECT_1.cohortYear,
  };

  for (const achievement of Object.values(AchievementLevel)) {
    it(`should add multiple candidates to a given a cohort and ${achievement} achievement`, async () => {
      // retrieve the projects
      const projects = await prisma.project.findMany({
        where: {
          cohortYear: requestBody.cohort,
          achievement: achievement,
        },
      });

      const response = await request
        .post(`${BASE_URL}/${mockVoteEvent2Id}/candidates/batch`)
        .send({ ...requestBody, achievement: achievement });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("candidates");
      expect(response.body.candidates).toEqual(projects);

      // Verify the candidates were actually connected in database
      const dbCheck = await prisma.voteEvent.findUnique({
        where: { id: mockVoteEvent2Id },
        include: { candidates: true },
      });

      expect(dbCheck).not.toBeNull();
      if (!dbCheck) return;
      expect(dbCheck.candidates).toEqual(projects);
    });
  }

  it("should add multiple candidates to a given a cohort and all achievement", async () => {
    // retrieve the projects
    const projects = await prisma.project.findMany({
      where: {
        cohortYear: requestBody.cohort,
      },
    });

    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent2Id}/candidates/batch`)
      .send({ ...requestBody, achievement: "All" });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("candidates");
    expect(response.body.candidates).toEqual(projects);

    // Verify the candidates were actually connected in database
    const dbCheck = await prisma.voteEvent.findUnique({
      where: { id: mockVoteEvent2Id },
      include: { candidates: true },
    });

    expect(dbCheck).not.toBeNull();
    if (!dbCheck) return;
    expect(dbCheck.candidates).toEqual(projects);
  });

  it("should not add candidates if cohort does not exist", async () => {
    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent2Id}/candidates/batch`)
      .send({
        cohort: 9999,
        achievement: "Artemis",
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("candidates");
    expect(response.body.candidates).toEqual([]);
  });

  it("should return 400 with invalid request body", async () => {
    const invalidRequest = {
      // Missing required fields
    };
    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent2Id}/candidates/batch`)
      .send(invalidRequest);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Request arguments failed validation checks"
    );
  });

  it("should handle errors during candidate addition", async () => {
    const addCandidateMock = jest
      .spyOn(voteEventHelpers, "addManyCandidates")
      .mockRejectedValueOnce(new Error("Database error"));
    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent2Id}/candidates/batch`)
      .send({
        ...requestBody,
        achievement: "Vostok",
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });
    addCandidateMock.mockRestore();
  });
});

describe("DELETE /:voteEventId/candidates/:candidateId", () => {
  it("should delete a candidate from a given vote event", async () => {
    const response = await request.delete(
      `${BASE_URL}/${mockVoteEvent1Id}/candidates/${mockProject1Id}`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("candidate");
    expect(response.body.candidate).toEqual(
      expect.objectContaining(MOCK_PROJECT_1)
    );

    // Verify the candidate was actually removed from the database
    const dbCheck = await prisma.project.findUnique({
      where: { id: mockProject1Id },
      include: { voteEvents: true },
    });
    const voteEvents = dbCheck?.voteEvents || [];
    expect(voteEvents).not.toContainEqual(
      expect.objectContaining({ id: mockVoteEvent1Id })
    );
  });

  it("should handle errors during candidate deletion", async () => {
    const removeCandidateMock = jest
      .spyOn(voteEventHelpers, "removeCandidate")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request.delete(
      `${BASE_URL}/${mockVoteEvent1Id}/candidates/${mockProject1Id}`
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    removeCandidateMock.mockRestore();
  });
});

describe("GET /:voteEventId/votes", () => {
  it("should return all votes for a given vote event and voter", async () => {
    const response = await requestWithStudentAuth.get(
      `${BASE_URL}/${mockVoteEvent1Id}/votes`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("votes");
    expect(response.body.votes).toEqual([{ projectId: mockProject1Id }]);
  });

  it("should return an empty array if the vote event does not exist", async () => {
    const response = await request.get(`${BASE_URL}/${NON_EXISTENT_ID}/votes`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ votes: [] });
  });

  it("should handle errors during vote retrieval", async () => {
    const getVoteEventVotesMock = jest
      .spyOn(voteEventHelpers, "getVotesByVoteEventAndVoter")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request.get(`${BASE_URL}/${mockVoteEvent1Id}/votes`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    getVoteEventVotesMock.mockRestore();
  });
});

describe("GET /:voteEventId/votes/all", () => {
  it("should return all votes for a given vote event", async () => {
    const response = await request.get(
      `${BASE_URL}/${mockVoteEvent1Id}/votes/all`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("votes");
    expect(response.body.votes).toHaveLength(2);
  });

  it("should return an empty array if the vote event does not exist", async () => {
    const response = await request.get(
      `${BASE_URL}/${NON_EXISTENT_ID}/votes/all`
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ votes: [] });
  });

  it("should handle errors during vote retrieval", async () => {
    const getVoteEventVotesMock = jest
      .spyOn(voteEventHelpers, "getAllVotesByVoteEvent")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request.get(
      `${BASE_URL}/${mockVoteEvent1Id}/votes/all`
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    getVoteEventVotesMock.mockRestore();
  });
});

describe("POST /:voteEventId/votes", () => {
  it("should add votes for a given vote event and internal voter", async () => {
    await prisma.vote.deleteMany();
    const response = await requestWithStudentAuth
      .post(`${BASE_URL}/${mockVoteEvent1Id}/votes`)
      .send({
        projectIds: [mockProject1Id],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("votes");
    expect(response.body.votes).toEqual([{ projectId: mockProject1Id }]);

    // Verify the votes were actually added to the database
    const dbCheck = await prisma.vote.findMany({
      where: {
        userId: userIds[0],
        projectId: mockProject1Id,
        voteEventId: mockVoteEvent1Id,
      },
    });
    expect(dbCheck).toHaveLength(1);
    expect(dbCheck[0]).toEqual(
      expect.objectContaining({
        userId: userIds[0],
        projectId: mockProject1Id,
        voteEventId: mockVoteEvent1Id,
      })
    );
  });

  it("should add votes for a given vote event and external voter", async () => {
    await prisma.vote.deleteMany();
    const response = await requestWithExternalVoterAuth
      .post(`${BASE_URL}/${mockVoteEvent1Id}/votes`)
      .send({
        projectIds: [mockProject1Id],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("votes");
    expect(response.body.votes).toEqual([{ projectId: mockProject1Id }]);

    // Verify the votes were actually added to the database
    const dbCheck = await prisma.vote.findMany({
      where: {
        externalVoterId: VOTER_ID_1,
        projectId: mockProject1Id,
        voteEventId: mockVoteEvent1Id,
      },
    });
    expect(dbCheck).toHaveLength(1);
    expect(dbCheck[0]).toEqual(
      expect.objectContaining({
        externalVoterId: VOTER_ID_1,
        projectId: mockProject1Id,
        voteEventId: mockVoteEvent1Id,
      })
    );
  });

  it("should return 400 with an invalid request body", async () => {
    const invalidRequest = {
      // Missing required fields
    };

    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent1Id}/votes`)
      .send(invalidRequest);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Request arguments failed validation checks"
    );
  });

  it("should return 400 if votes are already submitted", async () => {
    const response = await requestWithStudentAuth
      .post(`${BASE_URL}/${mockVoteEvent1Id}/votes`)
      .send({
        projectIds: [mockProject1Id],
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "You have already voted in this event",
    });
  });

  it("should return 400 if the vote event does not exist", async () => {
    const response = await request
      .post(`${BASE_URL}/${NON_EXISTENT_ID}/votes`)
      .send({
        projectIds: [mockProject1Id],
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Vote event does not exist",
    });
  });

  it("should return 400 if vote config is not yet set", async () => {
    await prisma.voteEvent.update({
      where: { id: mockVoteEvent2Id },
      data: {
        startTime: new Date("2000-05-25"),
        endTime: new Date("2100-07-25"),
      },
    });

    const response = await request
      .post(`${BASE_URL}/${mockVoteEvent2Id}/votes`)
      .send({
        projectIds: [mockProject1Id],
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Vote event setup is not complete",
    });
  });

  it("should return 400 if voting has not started", async () => {
    const voteEvent = await prisma.voteEvent.create({
      data: {
        title: "Vote Event 3",
        startTime: new Date("2100-05-25"),
        endTime: new Date("2125-07-25"),
      },
    });

    const response = await request
      .post(`${BASE_URL}/${voteEvent.id}/votes`)
      .send({
        projectIds: [mockProject1Id],
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Vote event is not open",
    });
  });

  it("should return 400 if voting has ended", async () => {
    const voteEvent = await prisma.voteEvent.create({
      data: {
        title: "Vote Event 3",
        startTime: new Date("2000-05-25"),
        endTime: new Date("2000-07-25"),
      },
    });

    const response = await request
      .post(`${BASE_URL}/${voteEvent.id}/votes`)
      .send({
        projectIds: [mockProject1Id],
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Vote event is not open",
    });
  });

  it("should return 400 if number of votes exceeds maximum amount", async () => {
    const voteEvent = await prisma.voteEvent.update({
      where: { id: mockVoteEvent1Id },
      data: {
        voteConfig: {
          update: {
            ...MOCK_VOTE_CONFIG,
            maxVotes: 1,
            minVotes: 1,
          },
        },
      },
    });

    const response = await request
      .post(`${BASE_URL}/${voteEvent.id}/votes`)
      .send({
        projectIds: [mockProject1Id, mockProject2Id],
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Number of votes is not within the minimum and maximum limit",
    });
  });

  it("should return 400 if number of votes is below minimum amount", async () => {
    const voteEvent = await prisma.voteEvent.update({
      where: { id: mockVoteEvent1Id },
      data: {
        voteConfig: {
          update: {
            ...MOCK_VOTE_CONFIG,
            maxVotes: 3,
            minVotes: 3,
          },
        },
      },
    });

    const response = await request
      .post(`${BASE_URL}/${voteEvent.id}/votes`)
      .send({
        projectIds: [mockProject1Id],
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Number of votes is not within the minimum and maximum limit",
    });
  });
});

describe("DELETE /:voteEventId/votes/:voteId", () => {
  it("should delete a vote from a given vote event", async () => {
    const vote = await prisma.vote.create({
      data: {
        userId: userIds[0],
        projectId: mockProject1Id,
        voteEventId: mockVoteEvent2Id,
      },
    });

    const response = await request.delete(
      `${BASE_URL}/${mockVoteEvent2Id}/votes/${vote.id}`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("vote");
    expect(response.body.vote).toEqual(vote);

    // Verify the vote was actually removed from the database
    const dbCheck = await prisma.vote.findUnique({
      where: { id: vote.id },
    });
    expect(dbCheck).toBeNull();
  });

  it("should handle errors during vote deletion", async () => {
    const removeVoteMock = jest
      .spyOn(voteEventHelpers, "removeVote")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request.delete(
      `${BASE_URL}/${mockVoteEvent1Id}/votes/${NON_EXISTENT_ID}`
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    removeVoteMock.mockRestore();
  });
});

describe("GET /:voteEventId/results", () => {
  it("should return all results for a given vote event", async () => {
    const response = await request.get(
      `${BASE_URL}/${mockVoteEvent1Id}/results`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("results");
    expect(response.body.results).toEqual([
      {
        percentage: 100,
        points: 2,
        votes: 2,
        rank: 1,
        project: { ...MOCK_PROJECT_1, id: mockProject1Id },
      },
    ]);
  });

  it("should return 400 if vote event does not exist", async () => {
    const response = await request.get(
      `${BASE_URL}/${NON_EXISTENT_ID}/results`
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Vote event does not exist" });
  });

  it("should return 400 if vote event has not started", async () => {
    const voteEvent = await prisma.voteEvent.create({
      data: {
        title: "Vote Event 3",
        startTime: new Date("2100-05-25"),
        endTime: new Date("2125-07-25"),
      },
    });

    const response = await request.get(`${BASE_URL}/${voteEvent.id}/results`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Vote event has not started" });
  });

  it("should return 400 if results are not published", async () => {
    const voteEvent = await prisma.voteEvent.create({
      data: {
        title: "Vote Event 3",
        startTime: new Date("2000-05-25"),
        endTime: new Date("2000-07-25"),
        resultsFilter: {
          create: {
            ...voteEventHelpers.DEFAULT_RESULTS_FILTER,
            areResultsPublished: false,
          },
        },
      },
    });

    const response = await request.get(`${BASE_URL}/${voteEvent.id}/results`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Results are not published" });
  });
});
