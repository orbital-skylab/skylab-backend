import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import { AchievementLevel } from "@prisma/client";
import {
  MOCK_PROJECT_1,
  MOCK_PROJECT_2,
  MOCK_VOTE_CONFIG,
  MOCK_VOTE_EVENT_1,
  MOCK_VOTE_EVENT_2,
  MOCK_VOTER_MANAGEMENT,
  NON_EXISTENT_ID,
  NON_EXISTENT_USER_EMAIL,
  VOTER_ID_1,
  VOTER_ID_2,
} from "../../__mocks__/voteEvent.mocks";
import { prisma } from "../../src/client";
import {
  addCandidate,
  addExternalVoter,
  addInternalVoter,
  addManyCandidates,
  addManyVotes,
  createVoteEvent,
  editVoteEvent,
  getAllCandidatesByVoteEvent,
  getAllExternalVotersByVoteEvent,
  getAllInternalVotersByVoteEvent,
  getAllVoteEvents,
  getAllVotesByVoteEvent,
  getOneVoteEventById,
  getResultsByVoteEvent,
  getVotesByVoteEventAndVoter,
  removeCandidate,
  removeInternalVoter,
  removeVote,
  removeVoteEvent,
} from "../../src/helpers/voteEvent.helper";
import {
  KNOWN_EMAILS,
  voteEventTestSetUp,
  voteEventTestTearDown,
} from "../../src/utils/testUtils";
import { SkylabError } from "../../src/errors/SkylabError";
import { HttpStatusCode } from "../../src/utils/HTTP_Status_Codes";

let mockVoteEvent1Id: number;
let mockVoteEvent2Id: number;
let mockProject1Id: number;
let mockProject2Id: number;
let userIds: number[];

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

describe("getAllVoteEvents helper integration test", () => {
  it("should return all vote events", async () => {
    const voteEvents = await getAllVoteEvents();

    expect(voteEvents).toEqual([
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
    ]);
  });

  it("should return an empty array if no vote events found", async () => {
    await voteEventTestTearDown();

    const voteEvents = await getAllVoteEvents();

    expect(voteEvents).toEqual([]);
  });
});

describe("getOneVoteEventById helper integration test", () => {
  it("should return a single vote event by id", async () => {
    const voteEvent = await getOneVoteEventById(mockVoteEvent1Id);

    expect(voteEvent).toEqual(
      expect.objectContaining({ ...MOCK_VOTE_EVENT_1, id: mockVoteEvent1Id })
    );
  });

  it("should throw an error if vote event not found", async () => {
    await expect(getOneVoteEventById(NON_EXISTENT_ID)).rejects.toThrow(
      new SkylabError("Vote event was not found", HttpStatusCode.BAD_REQUEST)
    );
  });
});

describe("createVoteEvent helper integration test", () => {
  it("should create a new vote event", async () => {
    const newVoteEvent = await createVoteEvent({
      voteEvent: MOCK_VOTE_EVENT_1,
    });

    expect(newVoteEvent).toEqual({ ...MOCK_VOTE_EVENT_1, id: newVoteEvent.id });

    const dbCheck = await prisma.voteEvent.findUnique({
      where: { id: newVoteEvent.id },
    });
    expect(dbCheck).toEqual({ ...MOCK_VOTE_EVENT_1, id: newVoteEvent.id });
  });
});

describe("editVoteEvent helper integration test", () => {
  it("should update a vote event", async () => {
    const updatedVoteEvent = await editVoteEvent({
      voteEventId: mockVoteEvent1Id,
      body: {
        voteEvent: { ...MOCK_VOTE_EVENT_1, title: "Updated Vote Event" },
      },
    });

    expect(updatedVoteEvent).toEqual(
      expect.objectContaining({
        ...MOCK_VOTE_EVENT_1,
        id: mockVoteEvent1Id,
        title: "Updated Vote Event",
      })
    );

    const dbCheck = await prisma.voteEvent.findUnique({
      where: { id: mockVoteEvent1Id },
    });
    expect(dbCheck).toEqual({
      ...MOCK_VOTE_EVENT_1,
      id: mockVoteEvent1Id,
      title: "Updated Vote Event",
    });
  });

  it("should throw an error if vote event not found", async () => {
    await expect(
      editVoteEvent({
        voteEventId: NON_EXISTENT_ID,
        body: {
          voteEvent: { ...MOCK_VOTE_EVENT_1, title: "Updated Vote Event" },
        },
      })
    ).rejects.toThrow(
      new SkylabError("Vote event was not found", HttpStatusCode.BAD_REQUEST)
    );
  });
});

describe("removeVoteEvent helper integration test", () => {
  it("should delete a vote event", async () => {
    const deletedVoteEvent = await removeVoteEvent(mockVoteEvent1Id);

    expect(deletedVoteEvent).toEqual({
      ...MOCK_VOTE_EVENT_1,
      id: mockVoteEvent1Id,
    });

    const dbCheck = await prisma.voteEvent.findUnique({
      where: { id: mockVoteEvent1Id },
    });
    expect(dbCheck).toBeNull();
  });

  it("should throw an error if vote event not found", async () => {
    await expect(removeVoteEvent(NON_EXISTENT_ID)).rejects.toThrow();
  });
});

describe("getAllInternalVotersByVoteEvent helper integration test", () => {
  it("should return all internal voters by vote event", async () => {
    const internalVoters = await getAllInternalVotersByVoteEvent(
      mockVoteEvent1Id
    );

    expect(internalVoters).toHaveLength(KNOWN_EMAILS.length);
    expect(internalVoters).toEqual(
      expect.arrayContaining([
        ...KNOWN_EMAILS.map((email) => expect.objectContaining({ email })),
      ])
    );
  });

  it("should return an empty array if no internal voters found", async () => {
    const internalVoters = await getAllInternalVotersByVoteEvent(
      mockVoteEvent2Id
    );

    expect(internalVoters).toEqual([]);
  });
});

describe("addInternalVoter helper integration test", () => {
  it("should add an internal voter to a vote event", async () => {
    const internalVoter = await addInternalVoter({
      body: { email: KNOWN_EMAILS[0] },
      voteEventId: mockVoteEvent2Id,
    });

    expect(internalVoter.email).toBe(KNOWN_EMAILS[0]);

    const dbCheck = await prisma.user.findUnique({
      where: { email: KNOWN_EMAILS[0] },
      include: { voteEvents: true },
    });
    expect(dbCheck).toBeDefined();
    expect(dbCheck?.voteEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: mockVoteEvent2Id }),
      ])
    );
  });

  it("should throw an error if user is already part of vote event", async () => {
    try {
      await addInternalVoter({
        body: { email: KNOWN_EMAILS[0] },
        voteEventId: mockVoteEvent1Id,
      });
    } catch (e) {
      expect(e.message).toBe("User is already part of the vote event");
    }
  });

  it("should throw an error if user is not found", async () => {
    await expect(
      addInternalVoter({
        body: { email: NON_EXISTENT_USER_EMAIL },
        voteEventId: mockVoteEvent2Id,
      })
    ).rejects.toThrow();
  });
});

describe("removeInternalVoter helper integration test", () => {
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

  it("should remove an internal voter from a vote event", async () => {
    const removedInternalVoter = await removeInternalVoter(
      mockVoteEvent2Id,
      idToDelete
    );

    expect(removedInternalVoter.email).toBe(KNOWN_EMAILS[0]);

    const dbCheck = await prisma.user.findUnique({
      where: { email: KNOWN_EMAILS[0] },
      include: { voteEvents: true },
    });
    expect(dbCheck).toBeDefined();
    expect(dbCheck?.voteEvents).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: mockVoteEvent2Id }),
      ])
    );
  });

  it("should throw an error if internal voter not found", async () => {
    try {
      await removeInternalVoter(mockVoteEvent2Id, NON_EXISTENT_ID);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

describe("getAllExternalVotersByVoteEvent helper integration test", () => {
  it("should return all external voters by vote event", async () => {
    const externalVoters = await getAllExternalVotersByVoteEvent(
      mockVoteEvent1Id
    );

    expect(externalVoters).toEqual([
      { id: VOTER_ID_1, voteEventId: mockVoteEvent1Id },
      { id: VOTER_ID_2, voteEventId: mockVoteEvent1Id },
    ]);
  });

  it("should return an empty array if no external voters found", async () => {
    const externalVoters = await getAllExternalVotersByVoteEvent(
      mockVoteEvent2Id
    );

    expect(externalVoters).toEqual([]);
  });
});

describe("addExternalVoter helper integration test", () => {
  it("should add an external voter to a vote event", async () => {
    const externalVoter = await addExternalVoter({
      body: { voterId: "newVoter" },
      voteEventId: mockVoteEvent1Id,
    });

    expect(externalVoter.id).toBe("newVoter");

    const dbCheck = await prisma.externalVoter.findUnique({
      where: {
        id_voteEventId: { id: "newVoter", voteEventId: mockVoteEvent1Id },
      },
    });
    expect(dbCheck).toEqual({ id: "newVoter", voteEventId: mockVoteEvent1Id });
  });

  it("should throw an error if external voter is already part of vote event", async () => {
    try {
      await addExternalVoter({
        body: { voterId: VOTER_ID_1 },
        voteEventId: mockVoteEvent1Id,
      });
    } catch (e) {
      expect(e.message).toBe(
        "External voter is already part of the vote event"
      );
    }
  });
});

describe("removeExternalVoter helper integration test", () => {
  it("should remove an external voter from a vote event", async () => {
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

  it("should throw an error if external voter not found", async () => {
    try {
      await prisma.externalVoter.delete({
        where: {
          id_voteEventId: {
            id: "non existent voter id",
            voteEventId: mockVoteEvent1Id,
          },
        },
      });
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

describe("getAllCandidatesByVoteEvent helper integration test", () => {
  it("should return all candidates by vote event", async () => {
    const candidates = await getAllCandidatesByVoteEvent(mockVoteEvent1Id);

    expect(candidates).toEqual([
      { id: mockProject1Id, ...MOCK_PROJECT_1 },
      { id: mockProject2Id, ...MOCK_PROJECT_2 },
    ]);
  });

  it("should return an empty array if no candidates found", async () => {
    const candidates = await getAllCandidatesByVoteEvent(mockVoteEvent2Id);

    expect(candidates).toEqual([]);
  });
});

describe("addCandidate helper integration test", () => {
  it("should add a candidate to a vote event", async () => {
    const newCandidate = await addCandidate({
      body: { projectId: mockProject1Id },
      voteEventId: mockVoteEvent2Id,
    });

    expect(newCandidate).toEqual({ id: mockProject1Id, ...MOCK_PROJECT_1 });

    const dbCheck = await prisma.project.findUnique({
      where: { id: mockProject1Id },
      include: { voteEvents: true },
    });
    expect(dbCheck).toBeDefined();
    expect(dbCheck?.voteEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: mockVoteEvent2Id }),
      ])
    );
  });

  it("should throw an error if candidate is already part of vote event", async () => {
    try {
      await addCandidate({
        body: { projectId: mockProject1Id },
        voteEventId: mockVoteEvent1Id,
      });
    } catch (e) {
      expect(e.message).toBe("Project is already part of the vote event");
    }
  });

  it("should throw an error if project is not found", async () => {
    try {
      await addCandidate({
        body: { projectId: NON_EXISTENT_ID },
        voteEventId: mockVoteEvent2Id,
      });
    } catch (e) {
      expect(e.message).toBe("Project ID does not exist");
    }
  });
});

describe("addManyCandidates helper integration test", () => {
  it("should add multiple candidates to a vote event", async () => {
    const projects = await prisma.project.findMany({
      where: {
        cohortYear: MOCK_PROJECT_1.cohortYear,
        achievement: MOCK_PROJECT_1.achievement as AchievementLevel,
      },
    });

    const newCandidates = await addManyCandidates({
      body: {
        cohort: MOCK_PROJECT_1.cohortYear,
        achievement: MOCK_PROJECT_1.achievement,
      },
      voteEventId: mockVoteEvent1Id,
    });

    expect(newCandidates).toHaveLength(projects.length + 1);
    expect(newCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ...MOCK_PROJECT_2, id: mockProject2Id }),
        ...projects.map((project) => expect.objectContaining(project)),
      ])
    );
  });

  it("should not add any candidates if none found", async () => {
    const newCandidates = await addManyCandidates({
      body: {
        cohort: 9999,
        achievement: "Artemis",
      },
      voteEventId: mockVoteEvent2Id,
    });

    expect(newCandidates).toEqual([]);
  });

  it("should throw an error if vote event not found", async () => {
    await expect(
      addManyCandidates({
        body: {
          cohort: MOCK_PROJECT_1.cohortYear,
          achievement: MOCK_PROJECT_1.achievement,
        },
        voteEventId: NON_EXISTENT_ID,
      })
    ).rejects.toThrow();
  });
});

describe("removeCandidate helper integration test", () => {
  it("should remove a candidate from a vote event", async () => {
    const deletedCandidate = await removeCandidate(
      mockVoteEvent1Id,
      mockProject1Id
    );

    expect(deletedCandidate).toEqual(
      expect.objectContaining({ ...MOCK_PROJECT_1, id: mockProject1Id })
    );

    const dbCheck = await prisma.project.findUnique({
      where: { id: mockProject1Id },
      include: { voteEvents: true },
    });
    expect(dbCheck).toBeDefined();
    expect(dbCheck?.voteEvents).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: mockVoteEvent1Id }),
      ])
    );
  });

  it("should throw an error if candidate not found", async () => {
    await expect(
      removeCandidate(mockVoteEvent1Id, NON_EXISTENT_ID)
    ).rejects.toThrow();
  });
});

describe("getVotesByVoteEventAndVoter helper integration test", () => {
  it("should return all votes by vote event and voter", async () => {
    const votes = await getVotesByVoteEventAndVoter(
      mockVoteEvent1Id,
      undefined,
      VOTER_ID_1
    );

    expect(votes).toEqual([{ projectId: mockProject1Id }]);
  });

  it("should return an empty array if no votes found", async () => {
    const votes = await getVotesByVoteEventAndVoter(
      mockVoteEvent1Id,
      undefined,
      VOTER_ID_2
    );

    expect(votes).toEqual([]);
  });
});

describe("getAllVotesByVoteEvent helper integration test", () => {
  it("should return all votes by vote event", async () => {
    const votesInDb = await prisma.vote.findMany({
      where: { voteEventId: mockVoteEvent1Id },
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
    const votes = await getAllVotesByVoteEvent(mockVoteEvent1Id);

    expect(votes).toHaveLength(votesInDb.length);
    expect(votes).toEqual(votesInDb);
  });

  it("should return an empty array if no votes found", async () => {
    // delete all votes
    await prisma.vote.deleteMany();

    const votes = await getAllVotesByVoteEvent(mockVoteEvent1Id);

    expect(votes).toEqual([]);
  });
});

describe("addManyVotes helper integration test", () => {
  it("should add multiple votes to a vote event", async () => {
    const newVotes = await addManyVotes({
      body: {
        externalVoterId: VOTER_ID_2,
        projectIds: [mockProject1Id, mockProject2Id],
      },
      voteEventId: mockVoteEvent1Id,
    });

    expect(newVotes).toHaveLength(2);
    expect(newVotes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ projectId: mockProject1Id }),
        expect.objectContaining({ projectId: mockProject2Id }),
      ])
    );
  });

  it("should throw an error if given userId does not exist", async () => {
    await expect(
      addManyVotes({
        body: {
          userId: NON_EXISTENT_ID,
          projectIds: [mockProject1Id],
        },
        voteEventId: mockVoteEvent1Id,
      })
    ).rejects.toThrow();
  });

  it("should throw an error if given externalVoterId does not exist", async () => {
    await expect(
      addManyVotes({
        body: {
          externalVoterId: "non existent voter id",
          projectIds: [mockProject1Id],
        },
        voteEventId: mockVoteEvent1Id,
      })
    ).rejects.toThrow();
  });

  it("should throw an error if given projectIds do not exist", async () => {
    await expect(
      addManyVotes({
        body: {
          externalVoterId: VOTER_ID_1,
          projectIds: [NON_EXISTENT_ID],
        },
        voteEventId: mockVoteEvent1Id,
      })
    ).rejects.toThrow();
  });
});

describe("removeVote helper integration test", () => {
  it("should remove a vote from a vote event", async () => {
    const voteToDelete = {
      userId: userIds[1],
      projectId: mockProject1Id,
      voteEventId: mockVoteEvent1Id,
    };
    const toDelete = await prisma.vote.create({
      data: voteToDelete,
    });

    const deletedVote = await removeVote(toDelete.id);

    expect(deletedVote).toEqual(toDelete);

    const dbCheck = await prisma.vote.findUnique({
      where: {
        id: toDelete.id,
      },
    });
    expect(dbCheck).toBeNull();
  });

  it("should throw an error if vote not found", async () => {
    await expect(removeVote(NON_EXISTENT_ID)).rejects.toThrow();
  });
});

describe("getResultsByVoteEvent helper integration test", () => {
  it("should return the results of a vote event", async () => {
    const results = await getResultsByVoteEvent(mockVoteEvent1Id);

    expect(results).toEqual([
      {
        rank: 1,
        percentage: 100,
        votes: 2,
        points: 2,
        project: { ...MOCK_PROJECT_1, id: mockProject1Id },
      },
    ]);
  });

  it("should return an empty array if no results found", async () => {
    // delete all votes
    await prisma.vote.deleteMany();

    const results = await getResultsByVoteEvent(mockVoteEvent1Id);

    expect(results).toEqual([]);
  });

  it("should throw an error if vote event not found", async () => {
    await expect(getResultsByVoteEvent(NON_EXISTENT_ID)).rejects.toThrow();
  });
});
