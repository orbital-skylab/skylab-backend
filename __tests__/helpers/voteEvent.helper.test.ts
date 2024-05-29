import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  addExternalVoter,
  addInternalVoter,
  editVoteEvent,
  getAllExternalVotersByVoteEvent,
  getAllInternalVotersByVoteEvent,
  getAllVoteEvents,
  getOneVoteEventById,
  removeAllExternalVotersByVoteEvent,
  removeAllInternalVotersByVoteEvent,
  removeExternalVoter,
  removeInternalVoter,
  removeVoteEvent,
  VOTE_EVENT_INCLUSION,
} from "../../src/helpers/voteEvent.helper";
import * as voteEventModel from "../../src/models/voteEvent.db";
import * as userModel from "../../src/models/users.db";
import { HttpStatusCode } from "../../src/utils/HTTP_Status_Codes";
import { SkylabError } from "../../src/errors/SkylabError";

const MOCK_VOTE_EVENT_1 = {
  id: 1,
  title: "Event 1",
  startTime: new Date(),
  endTime: new Date(),
};
const MOCK_VOTE_EVENT_2 = {
  id: 2,
  title: "Event 2",
  startTime: new Date(),
  endTime: new Date(),
};
const UPDATED_VOTE_EVENT_1 = {
  id: 1,
  title: "Updated Event 1",
  startTime: new Date(),
  endTime: new Date(),
};
const USER_1 = {
  id: 1,
  name: "John Doe",
  email: "john.doe@example.com",
  profilePicUrl: "https://example.com/profile-pic.jpg",
  githubUrl: "https://github.com/johndoe",
  linkedinUrl: "https://linkedin.com/in/johndoe",
  personalSiteUrl: "https://johndoe.com",
  selfIntro:
    "Hi, I'm John Doe, a software developer with a passion for open-source.",
  password: "$2b$10$eXamPl3HasH3dP4ssw0rD.", // Hashed password
  submitterId: null,
  administrator: [],
  adviser: [],
  mentor: [],
  student: [],
  submitted: [],
  received: [],
  announcements: [],
  announcementComments: [],
  announcementReadLogs: [],
  voteEvents: [],
  Vote: [],
};
const MOCK_EXTERNAL_VOTER_1 = {
  id: "voter1",
  voteEventId: MOCK_VOTE_EVENT_1.id,
};

const MOCK_EXTERNAL_VOTER_2 = {
  id: "voter2",
  voteEventId: MOCK_VOTE_EVENT_1.id,
};
const NON_EXISTENT_VOTE_EVENT_ID = 99;
const NON_EXISTENT_USER_ID = 99;
const NON_EXISTENT_USER_EMAIL = "non.existent@example.com";

// --- Vote Event Helper Functions Tests ---

describe("getAllVoteEvents helper test", () => {
  let findManyVoteEventsSpy;

  beforeAll(() => {
    findManyVoteEventsSpy = jest.spyOn(voteEventModel, "findManyVoteEvents");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return all vote events", async () => {
    const mockVoteEvents = [MOCK_VOTE_EVENT_1, MOCK_VOTE_EVENT_2];
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

  it("should handle errors gracefully", async () => {
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
    const mockVoteEvent = { ...MOCK_VOTE_EVENT_1 };
    findUniqueVoteEventSpy.mockResolvedValueOnce(mockVoteEvent);

    const result = await getOneVoteEventById(MOCK_VOTE_EVENT_1.id);

    expect(result).toEqual(mockVoteEvent);
    expect(findUniqueVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(findUniqueVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1.id },
      include: VOTE_EVENT_INCLUSION,
    });
  });

  it("should throw SkylabError with bad request status code when vote event not found", async () => {
    findUniqueVoteEventSpy.mockRejectedValue(
      new SkylabError("Vote event was not found", HttpStatusCode.BAD_REQUEST)
    );

    await expect(
      getOneVoteEventById(NON_EXISTENT_VOTE_EVENT_ID)
    ).rejects.toThrowError(SkylabError);
    await expect(
      getOneVoteEventById(NON_EXISTENT_VOTE_EVENT_ID)
    ).rejects.toThrowError("Vote event was not found");

    expect(findUniqueVoteEventSpy).toHaveBeenCalledTimes(2);
    expect(findUniqueVoteEventSpy).toHaveBeenCalledWith({
      where: { id: NON_EXISTENT_VOTE_EVENT_ID },
      include: VOTE_EVENT_INCLUSION,
    });
  });

  it("should propagate other errors", async () => {
    const errorMessage = "Error fetching vote event";
    findUniqueVoteEventSpy.mockRejectedValue(new Error(errorMessage));

    await expect(
      getOneVoteEventById(MOCK_VOTE_EVENT_1.id)
    ).rejects.toThrowError(errorMessage);

    expect(findUniqueVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(findUniqueVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1.id },
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
      ...MOCK_VOTE_EVENT_1,
      ...UPDATED_VOTE_EVENT_1,
    };

    updateVoteEventSpy.mockResolvedValueOnce(mockUpdatedVoteEvent);

    const result = await editVoteEvent({
      body: { voteEvent: UPDATED_VOTE_EVENT_1 },
      voteEventId: MOCK_VOTE_EVENT_1.id,
    });

    expect(result).toEqual(mockUpdatedVoteEvent);
    expect(updateVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(updateVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1.id },
      data: UPDATED_VOTE_EVENT_1,
      include: VOTE_EVENT_INCLUSION,
    });
  });

  it("should throw SkylabError when updated vote event is not returned", async () => {
    updateVoteEventSpy.mockResolvedValueOnce(null);

    await expect(
      editVoteEvent({
        body: { voteEvent: UPDATED_VOTE_EVENT_1 },
        voteEventId: NON_EXISTENT_VOTE_EVENT_ID,
      })
    ).rejects.toThrowError(
      new SkylabError(
        "Error occurred while updating vote event",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      )
    );

    expect(updateVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(updateVoteEventSpy).toHaveBeenCalledWith({
      where: { id: NON_EXISTENT_VOTE_EVENT_ID },
      data: UPDATED_VOTE_EVENT_1,
      include: VOTE_EVENT_INCLUSION,
    });
  });

  it("should propagate other errors", async () => {
    const errorMessage = "Database connection error";
    updateVoteEventSpy.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      editVoteEvent({
        body: { voteEvent: UPDATED_VOTE_EVENT_1 },
        voteEventId: MOCK_VOTE_EVENT_1.id,
      })
    ).rejects.toThrowError(new Error(errorMessage));

    expect(updateVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(updateVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1.id },
      data: UPDATED_VOTE_EVENT_1,
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
    deleteVoteEventSpy.mockResolvedValueOnce(MOCK_VOTE_EVENT_1);

    await removeVoteEvent(MOCK_VOTE_EVENT_1.id);

    expect(deleteVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(deleteVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1.id },
    });
  });

  it("should throw SkylabError when no vote event is returned", async () => {
    deleteVoteEventSpy.mockResolvedValueOnce(null);

    await expect(
      removeVoteEvent(NON_EXISTENT_VOTE_EVENT_ID)
    ).rejects.toThrowError(
      new SkylabError(
        "Error occurred while deleting vote event",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      )
    );

    expect(deleteVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(deleteVoteEventSpy).toHaveBeenCalledWith({
      where: { id: NON_EXISTENT_VOTE_EVENT_ID },
    });
  });

  it("should propagate other errors", async () => {
    const errorMessage = "Database connection error";
    deleteVoteEventSpy.mockRejectedValueOnce(new Error(errorMessage));

    await expect(removeVoteEvent(MOCK_VOTE_EVENT_1.id)).rejects.toThrowError(
      new Error(errorMessage)
    );

    expect(deleteVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(deleteVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1.id },
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
      { ...USER_1, voteEvents: [{ id: MOCK_VOTE_EVENT_1.id }] },
    ];
    findManyUsersSpy.mockResolvedValueOnce(MOCK_INTERNAL_VOTERS);

    const result = await getAllInternalVotersByVoteEvent(MOCK_VOTE_EVENT_1.id);

    expect(result).toEqual(MOCK_INTERNAL_VOTERS);
    expect(findManyUsersSpy).toHaveBeenCalledTimes(1);
    expect(findManyUsersSpy).toHaveBeenCalledWith({
      where: { voteEvents: { some: { id: MOCK_VOTE_EVENT_1.id } } },
    });
  });

  it("should return an empty array if no internal voters found", async () => {
    findManyUsersSpy.mockResolvedValueOnce([]);

    const result = await getAllInternalVotersByVoteEvent(MOCK_VOTE_EVENT_1.id);

    expect(result).toEqual([]);
    expect(findManyUsersSpy).toHaveBeenCalledTimes(1);
    expect(findManyUsersSpy).toHaveBeenCalledWith({
      where: { voteEvents: { some: { id: MOCK_VOTE_EVENT_1.id } } },
    });
  });

  it("should propagate errors", async () => {
    const errorMessage = "Database connection error";
    findManyUsersSpy.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      getAllInternalVotersByVoteEvent(MOCK_VOTE_EVENT_1.id)
    ).rejects.toThrowError(new Error(errorMessage));

    expect(findManyUsersSpy).toHaveBeenCalledTimes(1);
    expect(findManyUsersSpy).toHaveBeenCalledWith({
      where: { voteEvents: { some: { id: MOCK_VOTE_EVENT_1.id } } },
    });
  });
});

describe("addInternalVoter helper test", () => {
  let updateUniqueUserSpy;

  beforeAll(() => {
    updateUniqueUserSpy = jest.spyOn(userModel, "updateUniqueUser");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully add a voter to a vote event", async () => {
    const mockUpdatedUser = {
      ...USER_1,
      voteEvents: [{ id: MOCK_VOTE_EVENT_1 }],
    };

    updateUniqueUserSpy.mockResolvedValueOnce(mockUpdatedUser);

    const result = await addInternalVoter({
      body: { email: USER_1.email },
      voteEventId: MOCK_VOTE_EVENT_1.id,
    });

    expect(result).toEqual(mockUpdatedUser);
    expect(updateUniqueUserSpy).toHaveBeenCalledTimes(1);
    expect(updateUniqueUserSpy).toHaveBeenCalledWith({
      where: { email: USER_1.email },
      data: {
        voteEvents: {
          connect: { id: MOCK_VOTE_EVENT_1.id },
        },
      },
    });
  });

  it("should throw SkylabError when the user does not exist", async () => {
    updateUniqueUserSpy.mockResolvedValueOnce(null);

    await expect(
      addInternalVoter({
        body: { email: NON_EXISTENT_USER_EMAIL },
        voteEventId: MOCK_VOTE_EVENT_1.id,
      })
    ).rejects.toThrowError(
      new SkylabError(
        "Error occurred while adding internal voter",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      )
    );

    expect(updateUniqueUserSpy).toHaveBeenCalledTimes(1);
    expect(updateUniqueUserSpy).toHaveBeenCalledWith({
      where: { email: NON_EXISTENT_USER_EMAIL },
      data: {
        voteEvents: {
          connect: { id: MOCK_VOTE_EVENT_1.id },
        },
      },
    });
  });

  it("should propagate other errors", async () => {
    const errorMessage = "Database connection error";
    updateUniqueUserSpy.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      addInternalVoter({
        body: { email: USER_1.email },
        voteEventId: MOCK_VOTE_EVENT_1.id,
      })
    ).rejects.toThrowError(new Error(errorMessage));

    expect(updateUniqueUserSpy).toHaveBeenCalledTimes(1);
    expect(updateUniqueUserSpy).toHaveBeenCalledWith({
      where: { email: USER_1.email },
      data: {
        voteEvents: {
          connect: { id: MOCK_VOTE_EVENT_1.id },
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
      ...USER_1,
      voteEvents: [],
    };

    updateUniqueUserSpy.mockResolvedValueOnce(mockUpdatedUser);

    const result = await removeInternalVoter(MOCK_VOTE_EVENT_1.id, USER_1.id);

    expect(result).toEqual(mockUpdatedUser);
    expect(updateUniqueUserSpy).toHaveBeenCalledTimes(1);
    expect(updateUniqueUserSpy).toHaveBeenCalledWith({
      where: { id: USER_1.id },
      data: {
        voteEvents: {
          disconnect: { id: MOCK_VOTE_EVENT_1.id },
        },
      },
    });
  });

  it("should throw SkylabError when the user not returned", async () => {
    updateUniqueUserSpy.mockResolvedValueOnce(null);

    await expect(
      removeInternalVoter(MOCK_VOTE_EVENT_1.id, NON_EXISTENT_USER_ID)
    ).rejects.toThrowError(
      new SkylabError(
        "Error occurred while removing internal voter",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      )
    );

    expect(updateUniqueUserSpy).toHaveBeenCalledTimes(1);
    expect(updateUniqueUserSpy).toHaveBeenCalledWith({
      where: { id: NON_EXISTENT_USER_ID },
      data: {
        voteEvents: {
          disconnect: { id: MOCK_VOTE_EVENT_1.id },
        },
      },
    });
  });

  it("should propagate other errors", async () => {
    const errorMessage = "Database connection error";
    updateUniqueUserSpy.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      removeInternalVoter(MOCK_VOTE_EVENT_1.id, USER_1.id)
    ).rejects.toThrowError(new Error(errorMessage));

    expect(updateUniqueUserSpy).toHaveBeenCalledTimes(1);
    expect(updateUniqueUserSpy).toHaveBeenCalledWith({
      where: { id: USER_1.id },
      data: {
        voteEvents: {
          disconnect: { id: MOCK_VOTE_EVENT_1.id },
        },
      },
    });
  });
});

describe("removeAllInternalVotersByVoteEvent helper test", () => {
  let updateVoteEventSpy;

  beforeAll(() => {
    updateVoteEventSpy = jest.spyOn(voteEventModel, "updateVoteEvent");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully remove all internal voters from a vote event", async () => {
    const mockUpdatedVoteEvent = {
      ...MOCK_VOTE_EVENT_1,
      internalVoters: [],
    };

    updateVoteEventSpy.mockResolvedValueOnce(mockUpdatedVoteEvent);

    const result = await removeAllInternalVotersByVoteEvent(
      MOCK_VOTE_EVENT_1.id
    );

    expect(result).toEqual(mockUpdatedVoteEvent);
    expect(updateVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(updateVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1.id },
      data: {
        internalVoters: {
          set: [],
        },
      },
    });
  });

  it("should throw SkylabError when the vote event does not exist", async () => {
    updateVoteEventSpy.mockResolvedValueOnce(null);

    await expect(
      removeAllInternalVotersByVoteEvent(NON_EXISTENT_VOTE_EVENT_ID)
    ).rejects.toThrowError(
      new SkylabError(
        "Error occurred while removing internal voters",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      )
    );

    expect(updateVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(updateVoteEventSpy).toHaveBeenCalledWith({
      where: { id: NON_EXISTENT_VOTE_EVENT_ID },
      data: {
        internalVoters: {
          set: [],
        },
      },
    });
  });

  it("should propagate other errors", async () => {
    const errorMessage = "Database connection error";
    updateVoteEventSpy.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      removeAllInternalVotersByVoteEvent(MOCK_VOTE_EVENT_1.id)
    ).rejects.toThrowError(new Error(errorMessage));

    expect(updateVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(updateVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1.id },
      data: {
        internalVoters: {
          set: [],
        },
      },
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

    const result = await getAllExternalVotersByVoteEvent(MOCK_VOTE_EVENT_1.id);

    expect(result).toEqual(mockExternalVoters);
    expect(findManyExternalVotersSpy).toHaveBeenCalledTimes(1);
    expect(findManyExternalVotersSpy).toHaveBeenCalledWith({
      where: { voteEventId: MOCK_VOTE_EVENT_1.id },
    });
  });

  it("should return an empty array if no external voters are found", async () => {
    findManyExternalVotersSpy.mockResolvedValueOnce([]);

    const result = await getAllExternalVotersByVoteEvent(MOCK_VOTE_EVENT_1.id);

    expect(result).toEqual([]);
    expect(findManyExternalVotersSpy).toHaveBeenCalledTimes(1);
    expect(findManyExternalVotersSpy).toHaveBeenCalledWith({
      where: { voteEventId: MOCK_VOTE_EVENT_1.id },
    });
  });

  it("should propagate errors", async () => {
    const errorMessage = "Database connection error";
    findManyExternalVotersSpy.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      getAllExternalVotersByVoteEvent(MOCK_VOTE_EVENT_1.id)
    ).rejects.toThrowError(new Error(errorMessage));

    expect(findManyExternalVotersSpy).toHaveBeenCalledTimes(1);
    expect(findManyExternalVotersSpy).toHaveBeenCalledWith({
      where: { voteEventId: MOCK_VOTE_EVENT_1.id },
    });
  });
});

describe("addExternalVoter helper test", () => {
  let createExternalVoterSpy;

  beforeAll(() => {
    createExternalVoterSpy = jest.spyOn(voteEventModel, "createExternalVoter");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully add an external voter to a vote event", async () => {
    createExternalVoterSpy.mockResolvedValueOnce(MOCK_EXTERNAL_VOTER_1);

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

describe("removeAllExternalVotersByVoteEvent helper test", () => {
  let updateVoteEventSpy;

  beforeAll(() => {
    updateVoteEventSpy = jest.spyOn(voteEventModel, "updateVoteEvent");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully remove all external voters from a vote event", async () => {
    updateVoteEventSpy.mockResolvedValueOnce(MOCK_VOTE_EVENT_1);

    const result = await removeAllExternalVotersByVoteEvent(
      MOCK_VOTE_EVENT_1.id
    );

    expect(result).toEqual(MOCK_VOTE_EVENT_1);
    expect(updateVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(updateVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1.id },
      data: {
        externalVoters: {
          deleteMany: {},
        },
      },
    });
  });

  it("should throw SkylabError when no external voters is returned", async () => {
    updateVoteEventSpy.mockResolvedValueOnce(null);

    await expect(
      removeAllExternalVotersByVoteEvent(MOCK_VOTE_EVENT_1.id)
    ).rejects.toThrowError(
      new SkylabError(
        "Error occurred while removing external voters",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      )
    );

    expect(updateVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(updateVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1.id },
      data: {
        externalVoters: {
          deleteMany: {},
        },
      },
    });
  });

  it("should propagate other errors", async () => {
    const errorMessage = "Database connection error";
    updateVoteEventSpy.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      removeAllExternalVotersByVoteEvent(MOCK_VOTE_EVENT_1.id)
    ).rejects.toThrowError(new Error(errorMessage));

    expect(updateVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(updateVoteEventSpy).toHaveBeenCalledWith({
      where: { id: MOCK_VOTE_EVENT_1.id },
      data: {
        externalVoters: {
          deleteMany: {},
        },
      },
    });
  });
});
