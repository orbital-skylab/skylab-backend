/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import request from "supertest";
import { prisma } from "../../src/client";
import * as voteEventHelpers from "../../src/helpers/voteEvent.helper";
import app from "../../src/server";

const MOCK_VOTE_EVENT_1 = {
  id: 1,
  title: "Event 1",
  startTime: new Date("2024-03-25"),
  endTime: new Date("2024-07-25"),
};
const MOCK_VOTE_EVENT_2 = {
  id: 2,
  title: "Event 2",
  startTime: new Date("2024-10-25"),
  endTime: new Date("2024-12-20"),
};
const UPDATED_VOTE_EVENT_1 = {
  id: 1,
  title: "Updated Event 1",
  startTime: new Date("2024-05-25"),
  endTime: new Date("2024-07-25"),
};
const UPDATED_VOTE_EVENT_2 = {
  id: 1,
  title: "Updated Event 1 with voter management",
  startTime: new Date(),
  endTime: new Date(),
  voterManagement: {
    hasInternalList: true,
    hasRegistration: true,
    hasInternalCsvImport: true,
    hasExternalList: true,
    hasGeneration: true,
    hasExternalCsvImport: true,
    isRegistrationOpen: true,
  },
};

const NON_EXISTENT_VOTE_EVENT_ID = 999999;
const NON_EXISTENT_USER_ID = 999999999;
const VOTE_EVENTS = [MOCK_VOTE_EVENT_1, MOCK_VOTE_EVENT_2];
const BASE_URL = "/api/vote-events";
const KNOWN_EMAILS = [
  "student@skylab.com",
  "adviser@skylab.com",
  "mentor@skylab.com",
  "admin@skylab.com",
];
const VOTER_ID_1 = "abc123";
const VOTER_ID_2 = "efg456";

async function setUp() {
  await prisma.voteEvent.deleteMany();

  for (const voteEvent of VOTE_EVENTS) {
    await prisma.voteEvent.create({
      data: voteEvent,
    });
  }

  for (const email of KNOWN_EMAILS) {
    await voteEventHelpers.addInternalVoter({
      body: {
        email: email,
      },
      voteEventId: 1,
    });
  }

  await prisma.externalVoter.create({
    data: {
      id: VOTER_ID_1,
      voteEventId: MOCK_VOTE_EVENT_1.id,
    },
  });

  await prisma.externalVoter.create({
    data: {
      id: VOTER_ID_2,
      voteEventId: MOCK_VOTE_EVENT_1.id,
    },
  });
}

async function tearDown() {
  await prisma.voteEvent.deleteMany();
}

beforeEach(async () => {
  return await setUp();
});

afterAll(async () => {
  return await tearDown();
});

// --- Vote event API tests ---

describe("GET / endpoint", () => {
  it("should return all vote events", async () => {
    const response = await request(app).get(BASE_URL + "/");

    const voteEventsWithISOStrings = VOTE_EVENTS.map((event) => ({
      ...event,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
    }));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ voteEvents: voteEventsWithISOStrings });
    expect(response.body.voteEvents).toHaveLength(VOTE_EVENTS.length);
  });
});

describe("POST / endpoint", () => {
  const newVoteEvent = {
    title: "New Vote Event",
    startTime: new Date("2024-06-01"),
    endTime: new Date("2024-06-30"),
  };

  it("should create a new vote event with valid request body", async () => {
    const response = await request(app)
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

  it("should return 500 with invalid request body", async () => {
    const invalidVoteEvent = {
      // Missing required properties
    };

    const response = await request(app)
      .post(BASE_URL + "/")
      .send({ voteEvent: invalidVoteEvent });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message");
  });

  it("should handle errors during vote event creation", async () => {
    // Mocking the createVoteEvent function to throw an error
    const createVoteEvent = jest.spyOn(voteEventHelpers, "createVoteEvent");
    createVoteEvent.mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app)
      .post(BASE_URL + "/")
      .send({ voteEvent: newVoteEvent });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    createVoteEvent.mockRestore();
  });
});

describe("PUT /:voteEventId endpoint", () => {
  it("should update a vote event with valid request body", async () => {
    const response = await request(app)
      .put(`${BASE_URL}/${MOCK_VOTE_EVENT_1.id}`)
      .send({ voteEvent: UPDATED_VOTE_EVENT_2 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("voteEvent");
    const { voteEvent } = response.body;
    expect(voteEvent.id).toBe(MOCK_VOTE_EVENT_1.id);
    expect(voteEvent.title).toBe(UPDATED_VOTE_EVENT_2.title);
    expect(new Date(voteEvent.startTime)).toEqual(
      UPDATED_VOTE_EVENT_2.startTime
    );
    expect(new Date(voteEvent.endTime)).toEqual(UPDATED_VOTE_EVENT_2.endTime);
    expect(voteEvent.voterManagement).toEqual(
      UPDATED_VOTE_EVENT_2.voterManagement
    );
  });

  it("should return 400 if the vote event does not exist", async () => {
    const response = await request(app)
      .put(`${BASE_URL}/${NON_EXISTENT_VOTE_EVENT_ID}`)
      .send({ voteEvent: UPDATED_VOTE_EVENT_1 });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 500 with invalid request body", async () => {
    const invalidVoteEvent = {
      invalidProperty: "Invalid property",
    };

    const response = await request(app)
      .put(`${BASE_URL}/${MOCK_VOTE_EVENT_1.id}`)
      .send({ voteEvent: invalidVoteEvent });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message");
  });

  it("should handle errors during vote event update", async () => {
    const editVoteEventMock = jest
      .spyOn(voteEventHelpers, "editVoteEvent")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app)
      .put(`${BASE_URL}/${MOCK_VOTE_EVENT_1.id}`)
      .send({ voteEvent: UPDATED_VOTE_EVENT_1 });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    editVoteEventMock.mockRestore();
  });
});

describe("DELETE /:voteEventId endpoint", () => {
  it("should delete an existing vote event", async () => {
    const response = await request(app).delete(
      `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("voteEvent");
    const { voteEvent } = response.body;
    expect(voteEvent.id).toBe(MOCK_VOTE_EVENT_1.id);
    expect(voteEvent.title).toBe(MOCK_VOTE_EVENT_1.title);
    expect(new Date(voteEvent.startTime)).toEqual(MOCK_VOTE_EVENT_1.startTime);
    expect(new Date(voteEvent.endTime)).toEqual(MOCK_VOTE_EVENT_1.endTime);

    // Verify the vote event was actually deleted from the database
    const dbCheck = await prisma.voteEvent.findUnique({
      where: { id: MOCK_VOTE_EVENT_1.id },
    });
    expect(dbCheck).toBeNull();
  });

  it("should return 400 if the vote event does not exist", async () => {
    const response = await request(app).delete(
      `${BASE_URL}/${NON_EXISTENT_VOTE_EVENT_ID}`
    );

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should handle errors during vote event deletion", async () => {
    const removeVoteEventMock = jest
      .spyOn(voteEventHelpers, "removeVoteEvent")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app).delete(
      `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}`
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    removeVoteEventMock.mockRestore();
  });
});

// --- End of vote event API tests ---

// --- Internal voter API tests ---

describe("GET /:voteEventId/voter-management/internal-voters endpoint", () => {
  it("should return all internal voters for a given vote event", async () => {
    const response = await request(app).get(
      `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management/internal-voters`
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
    const response = await request(app).get(
      `${BASE_URL}/${NON_EXISTENT_VOTE_EVENT_ID}/voter-management/internal-voters`
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ internalVoters: [] });
  });

  it("should handle errors during internal voters retrieval", async () => {
    const getAllInternalVotersByVoteEventMock = jest
      .spyOn(voteEventHelpers, "getAllInternalVotersByVoteEvent")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app).get(
      `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management/internal-voters`
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    getAllInternalVotersByVoteEventMock.mockRestore();
  });
});

describe("PUT /:voteEventId/voter-management/internal-voters endpoint", () => {
  it("should add a new internal voter to a given vote event", async () => {
    const response = await request(app)
      .put(
        `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management/internal-voters`
      )
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

  it("should return 500 with invalid request body", async () => {
    const invalidRequest = {
      // Missing required fields
    };

    const response = await request(app)
      .put(
        `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management/internal-voters`
      )
      .send(invalidRequest);

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message");
  });

  it("should handle errors during internal voter addition", async () => {
    const addInternalVoterMock = jest
      .spyOn(voteEventHelpers, "addInternalVoter")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app)
      .put(
        `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management/internal-voters`
      )
      .send({ email: KNOWN_EMAILS[0] });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    addInternalVoterMock.mockRestore();
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
    const response = await request(app).delete(
      `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management/internal-voters/${idToDelete}`
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
      expect.objectContaining({ id: MOCK_VOTE_EVENT_1.id })
    );
  });

  it("should return 400 if the internal voter does not exist", async () => {
    const response = await request(app).delete(
      `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management/internal-voters/${NON_EXISTENT_USER_ID}`
    ); // Non-existent internal voter ID

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should return user without the vote event if the vote event does not exist", async () => {
    const response = await request(app).delete(
      `${BASE_URL}/${NON_EXISTENT_VOTE_EVENT_ID}/voter-management/internal-voters/${idToDelete}`
    ); // Non-existent vote event ID

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("internalVoter");
    const { internalVoter } = response.body;
    expect(internalVoter.id).toBe(idToDelete);
    expect(internalVoter.email).toBe(KNOWN_EMAILS[0]);
    expect(internalVoter.voteEvents).not.toContainEqual(
      expect.objectContaining({ id: NON_EXISTENT_VOTE_EVENT_ID })
    );
  });

  it("should handle errors during internal voter deletion", async () => {
    const removeInternalVoterMock = jest
      .spyOn(voteEventHelpers, "removeInternalVoter")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app).delete(
      `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management/internal-voters/${idToDelete}`
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
    const response = await request(app).get(
      `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management/external-voters`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("externalVoters");
    const { externalVoters } = response.body;
    expect(externalVoters).toHaveLength(2);
    expect(externalVoters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: VOTER_ID_1,
          voteEventId: MOCK_VOTE_EVENT_1.id,
        }),
        expect.objectContaining({
          id: VOTER_ID_2,
          voteEventId: MOCK_VOTE_EVENT_1.id,
        }),
      ])
    );
  });

  it("should return empty array if the vote event does not exist", async () => {
    const response = await request(app).get(
      `${BASE_URL}/${NON_EXISTENT_VOTE_EVENT_ID}/voter-management/external-voters`
    ); // Non-existent vote event ID

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ externalVoters: [] });
  });

  it("should handle errors during retrieval of external voters", async () => {
    const getAllExternalVotersByVoteEventMock = jest
      .spyOn(voteEventHelpers, "getAllExternalVotersByVoteEvent")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app).get(
      `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management/external-voters`
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    getAllExternalVotersByVoteEventMock.mockRestore();
  });
});

describe("POST /:voteEventId/voter-management/external-voters endpoint", () => {
  it("should create a new external voter for a given vote event", async () => {
    const response = await request(app)
      .post(
        `${BASE_URL}/${MOCK_VOTE_EVENT_2.id}/voter-management/external-voters`
      )
      .send({
        voterId: VOTER_ID_1,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("externalVoter");
    const { externalVoter } = response.body;
    expect(externalVoter.id).toBe(VOTER_ID_1);
    expect(externalVoter.voteEventId).toBe(MOCK_VOTE_EVENT_2.id);

    // Verify the external voter was actually created in the database
    const dbCheck = await prisma.externalVoter.findUnique({
      where: {
        id_voteEventId: { id: VOTER_ID_1, voteEventId: MOCK_VOTE_EVENT_2.id },
      },
    });
    expect(dbCheck).not.toBeNull();
    if (!dbCheck) return;
    expect(dbCheck.id).toBe(VOTER_ID_1);
    expect(dbCheck?.voteEventId).toBe(MOCK_VOTE_EVENT_2.id);
  });

  it("should return 500 with invalid request body", async () => {
    const invalidExternalVoter = {
      // Missing required properties
    };

    const response = await request(app)
      .post(
        `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management/external-voters`
      )
      .send(invalidExternalVoter);

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message");
  });

  it("should handle errors during external voter creation", async () => {
    const addExternalVoterMock = jest
      .spyOn(voteEventHelpers, "addExternalVoter")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app)
      .post(
        `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management/external-voters`
      )
      .send({
        voterId: VOTER_ID_1,
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    addExternalVoterMock.mockRestore();
  });
});

describe("DELETE /:voteEventId/voter-management/external-voters/:externalVoterId endpoint", () => {
  it("should delete an external voter for a given vote event", async () => {
    const response = await request(app).delete(
      `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management/external-voters/${VOTER_ID_1}`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("externalVoter");
    const { externalVoter } = response.body;
    expect(externalVoter.id).toBe(VOTER_ID_1);
    expect(externalVoter.voteEventId).toBe(MOCK_VOTE_EVENT_1.id);

    // Verify the external voter was actually deleted from the database
    const dbCheck = await prisma.externalVoter.findUnique({
      where: {
        id_voteEventId: { id: VOTER_ID_1, voteEventId: MOCK_VOTE_EVENT_1.id },
      },
    });
    expect(dbCheck).toBeNull();
  });

  it("should return 400 if the external voter does not exist", async () => {
    const response = await request(app).delete(
      `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management/external-voters/nonexistent`
    );

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should handle errors during external voter deletion", async () => {
    const removeExternalVoterMock = jest
      .spyOn(voteEventHelpers, "removeExternalVoter")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app).delete(
      `${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management/external-voters/${VOTER_ID_1}`
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    removeExternalVoterMock.mockRestore();
  });
});

// --- End of external voter API tests ---

// --- Voter management settings API tests ---

describe("PUT /:voteEventId/voter-management endpoint", () => {
  const updatedVoteEvent = {
    title: "Updated Event 1",
    startTime: new Date("2024-05-25"),
    endTime: new Date("2025-07-25"),
    voterManagement: {
      hasInternalList: true,
      hasRegistration: true,
      hasInternalCsvImport: true,
      hasExternalList: true,
      hasGeneration: true,
      hasExternalCsvImport: true,
      isRegistrationOpen: false,
    },
  };

  it("should edit voter management settings for a given vote event and remove all internal and external voters", async () => {
    const response = await request(app)
      .put(`${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management`)
      .send({ voteEvent: updatedVoteEvent });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("voteEvent");
    const { voteEvent } = response.body;
    expect(voteEvent).toEqual({
      ...updatedVoteEvent,
      id: MOCK_VOTE_EVENT_1.id,
      startTime: updatedVoteEvent.startTime.toISOString(),
      endTime: updatedVoteEvent.endTime.toISOString(),
    });
    expect(voteEvent.voterManagement).toEqual(updatedVoteEvent.voterManagement);

    // Verify the vote event was actually updated in the database
    const dbCheck = await prisma.voteEvent.findUnique({
      where: { id: MOCK_VOTE_EVENT_1.id },
      include: voteEventHelpers.VOTE_EVENT_INCLUSION,
    });
    expect(dbCheck).not.toBeNull();
    if (!dbCheck) return;
    expect(dbCheck.id).toBe(MOCK_VOTE_EVENT_1.id);
    expect(dbCheck.title).toBe(updatedVoteEvent.title);
    expect(dbCheck.startTime).toEqual(updatedVoteEvent.startTime);
    expect(dbCheck.endTime).toEqual(updatedVoteEvent.endTime);
    expect(dbCheck.voterManagement).toEqual(updatedVoteEvent.voterManagement);

    // Verify all internal and external voters were removed
    const internalVoters = await prisma.user.findMany({
      where: { voteEvents: { some: { id: MOCK_VOTE_EVENT_1.id } } },
    });
    expect(internalVoters).toHaveLength(0);

    const externalVoters = await prisma.externalVoter.findMany({
      where: { voteEventId: MOCK_VOTE_EVENT_1.id },
    });
    expect(externalVoters).toHaveLength(0);
  });

  it("should return 500 with invalid request body", async () => {
    const invalidVoteEvent = {
      invalidProperty: "Invalid property",
    };

    const response = await request(app)
      .put(`${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management`)
      .send({ voteEvent: invalidVoteEvent });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("message");
  });

  it("should handle errors during voter management editing", async () => {
    const editVoterManagementMock = jest
      .spyOn(voteEventHelpers, "editVoterManagement")
      .mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app)
      .put(`${BASE_URL}/${MOCK_VOTE_EVENT_1.id}/voter-management`)
      .send({ voteEvent: updatedVoteEvent });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Database error" });

    editVoterManagementMock.mockRestore();
  });
});
