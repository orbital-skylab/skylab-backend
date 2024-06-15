import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  MOCK_EXTERNAL_VOTER_1,
  MOCK_EXTERNAL_VOTER_2,
  MOCK_PROJECT_1_WITH_ID,
  MOCK_PROJECT_2_WITH_ID,
  MOCK_UPDATED_VOTE_EVENT_1,
  MOCK_USER_1,
  MOCK_VOTE_EVENT_1_WITH_ID,
  MOCK_VOTE_EVENT_2_WITH_ID,
  NON_EXISTENT_ID,
  NON_EXISTENT_USER_EMAIL,
} from "../../__mocks__/voteEvent.mocks";
import { SkylabError } from "../../src/errors/SkylabError";
import {
  VOTE_EVENT_INCLUSION,
  addCandidate,
  addExternalVoter,
  addInternalVoter,
  addManyCandidates,
  editVoteEvent,
  getAllCandidatesByVoteEvent,
  getAllExternalVotersByVoteEvent,
  getAllInternalVotersByVoteEvent,
  getAllVoteEvents,
  getOneVoteEventById,
  removeCandidate,
  removeExternalVoter,
  removeInternalVoter,
  removeVoteEvent,
} from "../../src/helpers/voteEvent.helper";
import * as projectModel from "../../src/models/projects.db";
import * as userModel from "../../src/models/users.db";
import * as voteEventModel from "../../src/models/voteEvent.db";
import { HttpStatusCode } from "../../src/utils/HTTP_Status_Codes";

// --- Vote Event Helper Functions Tests ---

describe("getAllVoteEvents helper unit test", () => {
  let findManyVoteEventsSpy;

  beforeAll(() => {
    findManyVoteEventsSpy = jest.spyOn(voteEventModel, "findManyVoteEvents");
  });

  afterEach(() => {
    jest.clearAllMocks();
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
    expect(findManyVoteEventsSpy).toHaveBeenCalledWith({});
  });

  it("should return an empty array if no vote events found", async () => {
    findManyVoteEventsSpy.mockResolvedValueOnce([]);

    const result = await getAllVoteEvents();

    expect(result).toEqual([]);
    expect(findManyVoteEventsSpy).toHaveBeenCalledTimes(1);
    expect(findManyVoteEventsSpy).toHaveBeenCalledWith({});
  });

  it("should propagate other errors", async () => {
    const errorMessage = "Error fetching vote events";
    findManyVoteEventsSpy.mockRejectedValueOnce(new Error(errorMessage));

    await expect(getAllVoteEvents()).rejects.toThrow(errorMessage);

    expect(findManyVoteEventsSpy).toHaveBeenCalledTimes(1);
    expect(findManyVoteEventsSpy).toHaveBeenCalledWith({});
  });
});

describe("getOneVoteEventById helper test", () => {
  let findUniqueVoteEventSpy;

  beforeAll(() => {
    findUniqueVoteEventSpy = jest.spyOn(voteEventModel, "findUniqueVoteEvent");
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  it("should propagate other errors", async () => {
    const errorMessage = "Error fetching vote event";
    findUniqueVoteEventSpy.mockRejectedValue(new Error(errorMessage));

    await expect(
      getOneVoteEventById(MOCK_VOTE_EVENT_1_WITH_ID.id)
    ).rejects.toThrowError(errorMessage);

    expect(findUniqueVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(findUniqueVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
      include: VOTE_EVENT_INCLUSION,
    });
  });
});

describe("editVoteEvent helper test", () => {
  let updateVoteEventSpy;

  beforeAll(() => {
    updateVoteEventSpy = jest.spyOn(voteEventModel, "updateVoteEvent");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully update a vote event", async () => {
    const mockUpdatedVoteEvent = {
      ...MOCK_VOTE_EVENT_1_WITH_ID,
      ...MOCK_UPDATED_VOTE_EVENT_1,
    };

    updateVoteEventSpy.mockResolvedValueOnce(mockUpdatedVoteEvent);

    const result = await editVoteEvent({
      body: { voteEvent: MOCK_UPDATED_VOTE_EVENT_1 },
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    expect(result).toEqual(mockUpdatedVoteEvent);
    expect(updateVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(updateVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
      data: MOCK_UPDATED_VOTE_EVENT_1,
      include: VOTE_EVENT_INCLUSION,
    });
  });

  it("should throw SkylabError when updated vote event is not returned", async () => {
    updateVoteEventSpy.mockResolvedValueOnce(null);

    await expect(
      editVoteEvent({
        body: { voteEvent: MOCK_UPDATED_VOTE_EVENT_1 },
        voteEventId: NON_EXISTENT_ID,
      })
    ).rejects.toThrowError(
      new SkylabError(
        "Error occurred while updating vote event",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      )
    );

    expect(updateVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(updateVoteEventSpy).toHaveBeenCalledWith({
      where: { id: NON_EXISTENT_ID },
      data: MOCK_UPDATED_VOTE_EVENT_1,
      include: VOTE_EVENT_INCLUSION,
    });
  });

  it("should propagate other errors", async () => {
    const errorMessage = "Database connection error";
    updateVoteEventSpy.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      editVoteEvent({
        body: { voteEvent: MOCK_UPDATED_VOTE_EVENT_1 },
        voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
      })
    ).rejects.toThrowError(new Error(errorMessage));

    expect(updateVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(updateVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
      data: MOCK_UPDATED_VOTE_EVENT_1,
      include: VOTE_EVENT_INCLUSION,
    });
  });
});

describe("removeVoteEvent helper test", () => {
  let deleteVoteEventSpy;

  beforeAll(() => {
    deleteVoteEventSpy = jest.spyOn(voteEventModel, "deleteVoteEvent");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully delete a vote event", async () => {
    deleteVoteEventSpy.mockResolvedValueOnce(MOCK_VOTE_EVENT_1_WITH_ID);

    await removeVoteEvent(MOCK_VOTE_EVENT_1_WITH_ID.id);

    expect(deleteVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(deleteVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
    });
  });

  it("should throw SkylabError when no vote event is returned", async () => {
    deleteVoteEventSpy.mockResolvedValueOnce(null);

    await expect(removeVoteEvent(NON_EXISTENT_ID)).rejects.toThrowError(
      new SkylabError(
        "Error occurred while deleting vote event",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      )
    );

    expect(deleteVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(deleteVoteEventSpy).toHaveBeenCalledWith({
      where: { id: NON_EXISTENT_ID },
    });
  });

  it("should propagate other errors", async () => {
    const errorMessage = "Database connection error";
    deleteVoteEventSpy.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      removeVoteEvent(MOCK_VOTE_EVENT_1_WITH_ID.id)
    ).rejects.toThrowError(new Error(errorMessage));

    expect(deleteVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(deleteVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
    });
  });
});

// --- End of Vote Event Helper Functions Tests ---

// --- Internal Voter Helper Functions Tests ---

describe("getAllInternalVotersByVoteEvent helper test", () => {
  let findManyUsersSpy;

  beforeAll(() => {
    findManyUsersSpy = jest.spyOn(userModel, "findManyUsers");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully retrieve all internal voters by vote event ID", async () => {
    const MOCK_INTERNAL_VOTERS = [
      { ...MOCK_USER_1, voteEvents: [{ id: MOCK_VOTE_EVENT_1_WITH_ID.id }] },
    ];
    findManyUsersSpy.mockResolvedValueOnce(MOCK_INTERNAL_VOTERS);

    const result = await getAllInternalVotersByVoteEvent(
      MOCK_VOTE_EVENT_1_WITH_ID.id
    );

    expect(result).toEqual(MOCK_INTERNAL_VOTERS);
    expect(findManyUsersSpy).toHaveBeenCalledTimes(1);
    expect(findManyUsersSpy).toHaveBeenCalledWith({
      where: { voteEvents: { some: { id: MOCK_VOTE_EVENT_1_WITH_ID.id } } },
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
    });
  });

  it("should propagate errors", async () => {
    const errorMessage = "Database connection error";
    findManyUsersSpy.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      getAllInternalVotersByVoteEvent(MOCK_VOTE_EVENT_1_WITH_ID.id)
    ).rejects.toThrowError(new Error(errorMessage));

    expect(findManyUsersSpy).toHaveBeenCalledTimes(1);
    expect(findManyUsersSpy).toHaveBeenCalledWith({
      where: { voteEvents: { some: { id: MOCK_VOTE_EVENT_1_WITH_ID.id } } },
    });
  });
});

describe("addInternalVoter helper test", () => {
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully add a voter to a vote event", async () => {
    updateUniqueUserSpy.mockResolvedValueOnce(mockUpdatedUser);
    findManyUsersSpy.mockResolvedValueOnce([]);

    const result = await addInternalVoter({
      body: { email: MOCK_USER_1.email },
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    expect(result).toEqual(mockUpdatedUser);
    expect(updateUniqueUserSpy).toHaveBeenCalledTimes(1);
    expect(updateUniqueUserSpy).toHaveBeenCalledWith({
      where: { email: MOCK_USER_1.email },
      data: {
        voteEvents: {
          connect: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
        },
      },
    });
    expect(findManyUsersSpy).toHaveBeenCalledTimes(1);
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
      new SkylabError(
        "There is no user with that email address",
        HttpStatusCode.BAD_REQUEST
      )
    );

    expect(updateUniqueUserSpy).toHaveBeenCalledTimes(1);
    expect(updateUniqueUserSpy).toHaveBeenCalledWith({
      where: { email: NON_EXISTENT_USER_EMAIL },
      data: {
        voteEvents: {
          connect: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
        },
      },
    });
  });

  it("should propagate other errors", async () => {
    const errorMessage = "Database connection error";
    updateUniqueUserSpy.mockRejectedValueOnce(new Error(errorMessage));
    findManyUsersSpy.mockResolvedValueOnce([]);

    await expect(
      addInternalVoter({
        body: { email: MOCK_USER_1.email },
        voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
      })
    ).rejects.toThrowError(new Error(errorMessage));

    expect(updateUniqueUserSpy).toHaveBeenCalledTimes(1);
    expect(updateUniqueUserSpy).toHaveBeenCalledWith({
      where: { email: MOCK_USER_1.email },
      data: {
        voteEvents: {
          connect: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
        },
      },
    });
  });
});

describe("removeInternalVoter helper test", () => {
  let updateUniqueUserSpy;

  beforeAll(() => {
    updateUniqueUserSpy = jest.spyOn(userModel, "updateUniqueUser");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully remove a voter from a vote event", async () => {
    const mockUpdatedUser = {
      ...MOCK_USER_1,
      voteEvents: [],
    };

    updateUniqueUserSpy.mockResolvedValueOnce(mockUpdatedUser);

    const result = await removeInternalVoter(
      MOCK_VOTE_EVENT_1_WITH_ID.id,
      MOCK_USER_1.id
    );

    expect(result).toEqual(mockUpdatedUser);
    expect(updateUniqueUserSpy).toHaveBeenCalledTimes(1);
    expect(updateUniqueUserSpy).toHaveBeenCalledWith({
      where: { id: MOCK_USER_1.id },
      data: {
        voteEvents: {
          disconnect: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
        },
      },
      include: { voteEvents: true },
    });
  });

  it("should throw SkylabError when the user not returned", async () => {
    updateUniqueUserSpy.mockResolvedValueOnce(null);

    await expect(
      removeInternalVoter(MOCK_VOTE_EVENT_1_WITH_ID.id, NON_EXISTENT_ID)
    ).rejects.toThrowError(
      new SkylabError(
        "Error occurred while removing internal voter",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      )
    );

    expect(updateUniqueUserSpy).toHaveBeenCalledTimes(1);
    expect(updateUniqueUserSpy).toHaveBeenCalledWith({
      where: { id: NON_EXISTENT_ID },
      data: {
        voteEvents: {
          disconnect: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
        },
      },
      include: { voteEvents: true },
    });
  });

  it("should propagate other errors", async () => {
    const errorMessage = "Database connection error";
    updateUniqueUserSpy.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      removeInternalVoter(MOCK_VOTE_EVENT_1_WITH_ID.id, MOCK_USER_1.id)
    ).rejects.toThrowError(new Error(errorMessage));

    expect(updateUniqueUserSpy).toHaveBeenCalledTimes(1);
    expect(updateUniqueUserSpy).toHaveBeenCalledWith({
      where: { id: MOCK_USER_1.id },
      data: {
        voteEvents: {
          disconnect: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
        },
      },
      include: { voteEvents: true },
    });
  });
});

// --- End of Internal Voter Helper Functions Tests ---

// --- External Voter Helper Functions Tests ---

describe("getAllExternalVotersByVoteEvent helper test", () => {
  let findManyExternalVotersSpy;

  beforeAll(() => {
    findManyExternalVotersSpy = jest.spyOn(
      voteEventModel,
      "findManyExternalVoters"
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  it("should propagate errors", async () => {
    const errorMessage = "Database connection error";
    findManyExternalVotersSpy.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      getAllExternalVotersByVoteEvent(MOCK_VOTE_EVENT_1_WITH_ID.id)
    ).rejects.toThrowError(new Error(errorMessage));

    expect(findManyExternalVotersSpy).toHaveBeenCalledTimes(1);
    expect(findManyExternalVotersSpy).toHaveBeenCalledWith({
      where: { voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id },
    });
  });
});

describe("addExternalVoter helper test", () => {
  let createExternalVoterSpy;
  let findManyExternalVotersSpy;

  beforeAll(() => {
    createExternalVoterSpy = jest.spyOn(voteEventModel, "createExternalVoter");
    findManyExternalVotersSpy = jest.spyOn(
      voteEventModel,
      "findManyExternalVoters"
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  it("should throw SkylabError when no external voter is returned", async () => {
    createExternalVoterSpy.mockResolvedValueOnce(null);

    await expect(
      addExternalVoter({
        body: { voterId: MOCK_EXTERNAL_VOTER_1.id },
        voteEventId: MOCK_EXTERNAL_VOTER_1.voteEventId,
      })
    ).rejects.toThrowError(
      new SkylabError(
        "Error occurred while adding external voter",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      )
    );

    expect(createExternalVoterSpy).toHaveBeenCalledTimes(1);
    expect(createExternalVoterSpy).toHaveBeenCalledWith({
      data: {
        id: MOCK_EXTERNAL_VOTER_1.id,
        voteEventId: MOCK_EXTERNAL_VOTER_1.voteEventId,
      },
    });
  });

  it("should propagate other errors", async () => {
    const errorMessage = "Database connection error";
    createExternalVoterSpy.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      addExternalVoter({
        body: { voterId: MOCK_EXTERNAL_VOTER_1.id },
        voteEventId: MOCK_EXTERNAL_VOTER_1.voteEventId,
      })
    ).rejects.toThrowError(new Error(errorMessage));

    expect(createExternalVoterSpy).toHaveBeenCalledTimes(1);
    expect(createExternalVoterSpy).toHaveBeenCalledWith({
      data: {
        id: MOCK_EXTERNAL_VOTER_1.id,
        voteEventId: MOCK_EXTERNAL_VOTER_1.voteEventId,
      },
    });
  });
});

describe("removeExternalVoter helper test", () => {
  let deleteExternalVoterSpy;

  beforeAll(() => {
    deleteExternalVoterSpy = jest.spyOn(voteEventModel, "deleteExternalVoter");
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  it("should throw SkylabError when the external voter is not returned", async () => {
    deleteExternalVoterSpy.mockResolvedValueOnce(null);

    await expect(
      removeExternalVoter(
        MOCK_EXTERNAL_VOTER_1.voteEventId,
        MOCK_EXTERNAL_VOTER_1.id
      )
    ).rejects.toThrowError(
      new SkylabError(
        "Error occurred while deleting external voter",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      )
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

  it("should propagate other errors", async () => {
    const errorMessage = "Database connection error";
    deleteExternalVoterSpy.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      removeExternalVoter(
        MOCK_EXTERNAL_VOTER_1.voteEventId,
        MOCK_EXTERNAL_VOTER_1.id
      )
    ).rejects.toThrowError(new Error(errorMessage));

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

describe("getAllCandidatesByVoteEvent helper test", () => {
  let findManyProjectsSpy;

  beforeAll(() => {
    findManyProjectsSpy = jest.spyOn(projectModel, "findManyProjects");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call the model function with the correct parameters", async () => {
    const mockProjects = [MOCK_PROJECT_1_WITH_ID, MOCK_PROJECT_2_WITH_ID];

    findManyProjectsSpy.mockResolvedValueOnce(mockProjects);

    await getAllCandidatesByVoteEvent(MOCK_VOTE_EVENT_1_WITH_ID.id);

    expect(findManyProjectsSpy).toHaveBeenCalledTimes(1);
    expect(findManyProjectsSpy).toHaveBeenCalledWith({
      where: { voteEvents: { some: { id: MOCK_VOTE_EVENT_1_WITH_ID.id } } },
    });
  });

  it("should return the correct value", async () => {
    const mockProjects = [MOCK_PROJECT_1_WITH_ID, MOCK_PROJECT_2_WITH_ID];
    findManyProjectsSpy.mockResolvedValueOnce(mockProjects);

    const result = await getAllCandidatesByVoteEvent(
      MOCK_VOTE_EVENT_1_WITH_ID.id
    );

    expect(result).toEqual(mockProjects);
  });
});

describe("addCandidate helper test", () => {
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call the model functions with the correct parameters", async () => {
    findManyProjectsSpy.mockResolvedValueOnce([]);
    updateOneProjectSpy.mockResolvedValueOnce(MOCK_PROJECT_1_WITH_ID);

    await addCandidate(addCandidateParams);

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

  it("should return the correct value", async () => {
    findManyProjectsSpy.mockResolvedValueOnce([]);
    updateOneProjectSpy.mockResolvedValueOnce(MOCK_PROJECT_1_WITH_ID);

    const result = await addCandidate(addCandidateParams);

    expect(result).toEqual(MOCK_PROJECT_1_WITH_ID);
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

describe("addManyCandidates helper test", () => {
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call the model functions with the correct parameters", async () => {
    findManyProjectsSpy.mockResolvedValueOnce([MOCK_PROJECT_1_WITH_ID]);
    updateVoteEventSpy.mockResolvedValueOnce(MOCK_VOTE_EVENT_1_WITH_ID);

    await addManyCandidates(addManyCandidatesParams);

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

  it("should return the correct value", async () => {
    const MOCK_VOTE_EVENT_1_WITH_ID_WITH_CANDIDATES = {
      ...MOCK_VOTE_EVENT_1_WITH_ID,
      candidates: [MOCK_PROJECT_1_WITH_ID],
    };
    findManyProjectsSpy.mockResolvedValueOnce([MOCK_PROJECT_1_WITH_ID]);
    updateVoteEventSpy.mockResolvedValueOnce(
      MOCK_VOTE_EVENT_1_WITH_ID_WITH_CANDIDATES
    );

    const result = await addManyCandidates(addManyCandidatesParams);

    expect(result).toEqual([MOCK_PROJECT_1_WITH_ID]);
  });
});

describe("removeCandidate helper test", () => {
  let updateOneProjectSpy;

  beforeAll(() => {
    updateOneProjectSpy = jest.spyOn(projectModel, "updateOneProject");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call the model function with the correct parameters", async () => {
    updateOneProjectSpy.mockResolvedValueOnce(MOCK_PROJECT_1_WITH_ID);

    await removeCandidate(
      MOCK_VOTE_EVENT_1_WITH_ID.id,
      MOCK_PROJECT_1_WITH_ID.id
    );

    expect(updateOneProjectSpy).toHaveBeenCalledTimes(1);
    expect(updateOneProjectSpy).toHaveBeenCalledWith({
      where: { id: MOCK_PROJECT_1_WITH_ID.id },
      data: {
        voteEvents: {
          disconnect: { id: MOCK_VOTE_EVENT_1_WITH_ID.id },
        },
      },
      include: { voteEvents: true },
    });
  });

  it("should return the correct value", async () => {
    updateOneProjectSpy.mockResolvedValueOnce(MOCK_PROJECT_1_WITH_ID);

    const result = await removeCandidate(
      MOCK_VOTE_EVENT_1_WITH_ID.id,
      MOCK_PROJECT_1_WITH_ID.id
    );

    expect(result).toEqual(MOCK_PROJECT_1_WITH_ID);
  });
});
