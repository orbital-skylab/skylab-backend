/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextFunction } from "express";
import supertest from "supertest";
import {
  MOCK_EXTERNAL_VOTER_1,
  MOCK_EXTERNAL_VOTER_2,
  MOCK_PROJECT_1,
  MOCK_PROJECT_1_WITH_ID,
  MOCK_PROJECT_2_WITH_ID,
  MOCK_USER_1,
  MOCK_VOTE_1,
  MOCK_VOTE_EVENT_1,
  MOCK_VOTE_EVENT_1_WITH_ID,
} from "../../__mocks__/voteEvent.mocks";
import * as voteEventHelpers from "../../src/helpers/voteEvent.helper";
import authorizeAdmin from "../../src/middleware/authorizeAdmin";
import app from "../../src/server";
import * as utils from "../../src/utils/ApiResponseWrapper";
import { AchievementLevel } from "@prisma/client";

const BASE_URL = "/api/vote-events";

let apiResponseWrapperSpy;
let routeErrorHandlerSpy;
const startTime = new Date();
const endTime = new Date();

const assertApiResponse = (calledWith: any) => {
  expect(apiResponseWrapperSpy).toHaveBeenCalledTimes(1);
  expect(routeErrorHandlerSpy).not.toHaveBeenCalled();

  expect(apiResponseWrapperSpy).toHaveBeenCalledWith(
    expect.any(Object),
    calledWith
  );
};

const assertRouteErrorHandler = (calledWith: any) => {
  expect(routeErrorHandlerSpy).toHaveBeenCalledTimes(1);

  expect(routeErrorHandlerSpy).toHaveBeenCalledWith(
    expect.any(Object),
    calledWith
  );
};

jest.mock("../../src/middleware/authorizeAdmin", () => ({
  __esModule: true,
  default: jest.fn(async (_1, res, next: NextFunction) => {
    next();
  }),
}));

beforeAll(() => {
  apiResponseWrapperSpy = jest.spyOn(utils, "apiResponseWrapper");
  routeErrorHandlerSpy = jest.spyOn(utils, "routeErrorHandler");
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("GET / route unit test", () => {
  let getAllVoteEventsSpy;
  beforeAll(() => {
    getAllVoteEventsSpy = jest.spyOn(voteEventHelpers, "getAllVoteEvents");
  });

  it("should call the helper function correctly", async () => {
    getAllVoteEventsSpy.mockResolvedValueOnce([]);

    await supertest(app).get(BASE_URL + "/");

    expect(getAllVoteEventsSpy).toHaveBeenCalledTimes(1);
    expect(getAllVoteEventsSpy).toHaveBeenCalledWith();

    assertApiResponse({ voteEvents: [] });
  });

  it("should call the error handler if an error is thrown", async () => {
    getAllVoteEventsSpy.mockRejectedValueOnce(new Error("Test Error"));

    await supertest(app).get(BASE_URL + "/");

    expect(getAllVoteEventsSpy).toHaveBeenCalledTimes(1);
    expect(getAllVoteEventsSpy).toHaveBeenCalledWith();

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("POST / route unit test", () => {
  let createVoteEventSpy;
  const requestBody = { voteEvent: MOCK_VOTE_EVENT_1 };

  beforeAll(() => {
    createVoteEventSpy = jest.spyOn(voteEventHelpers, "createVoteEvent");
  });

  it("should call the helper function correctly", async () => {
    createVoteEventSpy.mockResolvedValueOnce({
      ...MOCK_VOTE_EVENT_1_WITH_ID,
      startTime,
      endTime,
    });

    await supertest(app)
      .post(BASE_URL + "/")
      .send(requestBody);

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(createVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(createVoteEventSpy).toHaveBeenCalledWith({
      voteEvent: {
        ...MOCK_VOTE_EVENT_1,
        startTime: MOCK_VOTE_EVENT_1.startTime.toISOString(),
        endTime: MOCK_VOTE_EVENT_1.endTime.toISOString(),
      },
    });

    assertApiResponse({
      voteEvent: {
        ...MOCK_VOTE_EVENT_1_WITH_ID,
        startTime,
        endTime,
      },
    });
  });

  it("should call the error handler if an error is thrown", async () => {
    createVoteEventSpy.mockRejectedValueOnce(new Error("Test Error"));

    await supertest(app)
      .post(BASE_URL + "/")
      .send(requestBody);

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(createVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(createVoteEventSpy).toHaveBeenCalledWith({
      voteEvent: {
        ...MOCK_VOTE_EVENT_1,
        startTime: MOCK_VOTE_EVENT_1.startTime.toISOString(),
        endTime: MOCK_VOTE_EVENT_1.endTime.toISOString(),
      },
    });

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("GET /:voteEventId route unit test", () => {
  let getOneVoteEventByIdSpy;
  const returnValue = {
    ...MOCK_VOTE_EVENT_1_WITH_ID,
    startTime,
    endTime,
  };

  beforeAll(() => {
    getOneVoteEventByIdSpy = jest.spyOn(
      voteEventHelpers,
      "getOneVoteEventById"
    );
  });

  it("should call the helper function correctly", async () => {
    getOneVoteEventByIdSpy.mockResolvedValueOnce(returnValue);

    await supertest(app).get(BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id);

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getOneVoteEventByIdSpy).toHaveBeenCalledTimes(1);
    expect(getOneVoteEventByIdSpy).toHaveBeenCalledWith(1);

    assertApiResponse({ voteEvent: returnValue });
  });

  it("should call the error handler if an error is thrown", async () => {
    getOneVoteEventByIdSpy.mockRejectedValueOnce(new Error("Test Error"));

    await supertest(app).get(BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id);

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getOneVoteEventByIdSpy).toHaveBeenCalledTimes(1);
    expect(getOneVoteEventByIdSpy).toHaveBeenCalledWith(1);

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("PUT /:voteEventId route unit test", () => {
  let editVoteEventSpy;
  const requestBody = { voteEvent: MOCK_VOTE_EVENT_1 };

  beforeAll(() => {
    editVoteEventSpy = jest.spyOn(voteEventHelpers, "editVoteEvent");
  });

  it("should call the helper function correctly", async () => {
    editVoteEventSpy.mockResolvedValueOnce({
      ...MOCK_VOTE_EVENT_1_WITH_ID,
      startTime,
      endTime,
    });

    await supertest(app)
      .put(BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id)
      .send(requestBody);

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(editVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(editVoteEventSpy).toHaveBeenCalledWith({
      body: {
        voteEvent: {
          ...MOCK_VOTE_EVENT_1,
          startTime: MOCK_VOTE_EVENT_1.startTime.toISOString(),
          endTime: MOCK_VOTE_EVENT_1.endTime.toISOString(),
        },
      },
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    assertApiResponse({
      voteEvent: {
        ...MOCK_VOTE_EVENT_1_WITH_ID,
        startTime,
        endTime,
      },
    });
  });

  it("should call the error handler if an error is thrown", async () => {
    editVoteEventSpy.mockRejectedValueOnce(new Error("Test Error"));

    await supertest(app)
      .put(BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id)
      .send(requestBody);

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(editVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(editVoteEventSpy).toHaveBeenCalledWith({
      body: {
        voteEvent: {
          ...MOCK_VOTE_EVENT_1,
          startTime: MOCK_VOTE_EVENT_1.startTime.toISOString(),
          endTime: MOCK_VOTE_EVENT_1.endTime.toISOString(),
        },
      },
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("DELETE /:voteEventId route unit test", () => {
  let removeVoteEventSpy;

  beforeAll(() => {
    removeVoteEventSpy = jest.spyOn(voteEventHelpers, "removeVoteEvent");
  });

  it("should call the helper function correctly", async () => {
    removeVoteEventSpy.mockResolvedValueOnce(MOCK_VOTE_EVENT_1_WITH_ID);

    await supertest(app).delete(BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id);

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(removeVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(removeVoteEventSpy).toHaveBeenCalledWith(
      MOCK_VOTE_EVENT_1_WITH_ID.id
    );

    assertApiResponse({ voteEvent: MOCK_VOTE_EVENT_1_WITH_ID });
  });

  it("should call the error handler if an error is thrown", async () => {
    removeVoteEventSpy.mockRejectedValueOnce(new Error("Test Error"));

    await supertest(app).delete(BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id);

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(removeVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(removeVoteEventSpy).toHaveBeenCalledWith(
      MOCK_VOTE_EVENT_1_WITH_ID.id
    );

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("GET /:voteEventId/voter-management/internal-voters", () => {
  let getAllInternalVotersByVoteEventSpy;
  const returnValue = [MOCK_USER_1];

  beforeAll(() => {
    getAllInternalVotersByVoteEventSpy = jest.spyOn(
      voteEventHelpers,
      "getAllInternalVotersByVoteEvent"
    );
  });

  it("should call the helper function correctly", async () => {
    getAllInternalVotersByVoteEventSpy.mockResolvedValueOnce(returnValue);

    await supertest(app).get(
      BASE_URL +
        "/" +
        MOCK_VOTE_EVENT_1_WITH_ID.id +
        "/voter-management/internal-voters"
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllInternalVotersByVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(getAllInternalVotersByVoteEventSpy).toHaveBeenCalledWith(1);

    assertApiResponse({ internalVoters: returnValue });
  });

  it("should call the error handler if an error is thrown", async () => {
    getAllInternalVotersByVoteEventSpy.mockRejectedValueOnce(
      new Error("Test Error")
    );

    await supertest(app).get(
      BASE_URL +
        "/" +
        MOCK_VOTE_EVENT_1_WITH_ID.id +
        "/voter-management/internal-voters"
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllInternalVotersByVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(getAllInternalVotersByVoteEventSpy).toHaveBeenCalledWith(1);

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("POST /:voteEventId/voter-management/internal-voters", () => {
  let addInternalVoterSpy;
  const requestBody = { user: MOCK_USER_1 };

  beforeAll(() => {
    addInternalVoterSpy = jest.spyOn(voteEventHelpers, "addInternalVoter");
  });

  it("should call the helper function correctly", async () => {
    addInternalVoterSpy.mockResolvedValueOnce(MOCK_USER_1);

    await supertest(app)
      .post(
        BASE_URL +
          "/" +
          MOCK_VOTE_EVENT_1_WITH_ID.id +
          "/voter-management/internal-voters"
      )
      .send(requestBody);

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(addInternalVoterSpy).toHaveBeenCalledTimes(1);
    expect(addInternalVoterSpy).toHaveBeenCalledWith({
      body: requestBody,
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    assertApiResponse({ internalVoter: MOCK_USER_1 });
  });

  it("should call the error handler if an error is thrown", async () => {
    addInternalVoterSpy.mockRejectedValueOnce(new Error("Test Error"));

    await supertest(app)
      .post(
        BASE_URL +
          "/" +
          MOCK_VOTE_EVENT_1_WITH_ID.id +
          "/voter-management/internal-voters"
      )
      .send(requestBody);

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(addInternalVoterSpy).toHaveBeenCalledTimes(1);
    expect(addInternalVoterSpy).toHaveBeenCalledWith({
      body: requestBody,
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("DELETE /:voteEventId/voter-management/internal-voters/:internalVoterId", () => {
  let removeInternalVoterSpy;

  beforeAll(() => {
    removeInternalVoterSpy = jest.spyOn(
      voteEventHelpers,
      "removeInternalVoter"
    );
  });

  it("should call the helper function correctly", async () => {
    removeInternalVoterSpy.mockResolvedValueOnce(MOCK_USER_1);

    await supertest(app).delete(
      BASE_URL +
        "/" +
        MOCK_VOTE_EVENT_1_WITH_ID.id +
        "/voter-management/internal-voters/1"
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(removeInternalVoterSpy).toHaveBeenCalledTimes(1);
    expect(removeInternalVoterSpy).toHaveBeenCalledWith(
      MOCK_VOTE_EVENT_1_WITH_ID.id,
      1
    );

    assertApiResponse({ internalVoter: MOCK_USER_1 });
  });

  it("should call the error handler if an error is thrown", async () => {
    removeInternalVoterSpy.mockRejectedValueOnce(new Error("Test Error"));

    await supertest(app).delete(
      BASE_URL +
        "/" +
        MOCK_VOTE_EVENT_1_WITH_ID.id +
        "/voter-management/internal-voters/1"
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(removeInternalVoterSpy).toHaveBeenCalledTimes(1);
    expect(removeInternalVoterSpy).toHaveBeenCalledWith(
      MOCK_VOTE_EVENT_1_WITH_ID.id,
      1
    );

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("GET /:voteEventId/voter-management/external-voters", () => {
  let getAllExternalVotersByVoteEventSpy;
  const returnValue = [MOCK_EXTERNAL_VOTER_1, MOCK_EXTERNAL_VOTER_2];

  beforeAll(() => {
    getAllExternalVotersByVoteEventSpy = jest.spyOn(
      voteEventHelpers,
      "getAllExternalVotersByVoteEvent"
    );
  });

  it("should call the helper function correctly", async () => {
    getAllExternalVotersByVoteEventSpy.mockResolvedValueOnce(returnValue);

    await supertest(app).get(
      BASE_URL +
        "/" +
        MOCK_VOTE_EVENT_1_WITH_ID.id +
        "/voter-management/external-voters"
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllExternalVotersByVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(getAllExternalVotersByVoteEventSpy).toHaveBeenCalledWith(1);

    assertApiResponse({ externalVoters: returnValue });
  });

  it("should call the error handler if an error is thrown", async () => {
    getAllExternalVotersByVoteEventSpy.mockRejectedValueOnce(
      new Error("Test Error")
    );

    await supertest(app).get(
      BASE_URL +
        "/" +
        MOCK_VOTE_EVENT_1_WITH_ID.id +
        "/voter-management/external-voters"
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllExternalVotersByVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(getAllExternalVotersByVoteEventSpy).toHaveBeenCalledWith(1);

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("POST /:voteEventId/voter-management/external-voters", () => {
  let addExternalVoterSpy;
  const requestBody = { voterId: "voter1" };

  beforeAll(() => {
    addExternalVoterSpy = jest.spyOn(voteEventHelpers, "addExternalVoter");
  });

  it("should call the helper function correctly", async () => {
    addExternalVoterSpy.mockResolvedValueOnce(MOCK_EXTERNAL_VOTER_1);

    await supertest(app)
      .post(
        BASE_URL +
          "/" +
          MOCK_VOTE_EVENT_1_WITH_ID.id +
          "/voter-management/external-voters"
      )
      .send(requestBody);

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(addExternalVoterSpy).toHaveBeenCalledTimes(1);
    expect(addExternalVoterSpy).toHaveBeenCalledWith({
      body: requestBody,
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    assertApiResponse({ externalVoter: MOCK_EXTERNAL_VOTER_1 });
  });

  it("should call the error handler if an error is thrown", async () => {
    addExternalVoterSpy.mockRejectedValueOnce(new Error("Test Error"));

    await supertest(app)
      .post(
        BASE_URL +
          "/" +
          MOCK_VOTE_EVENT_1_WITH_ID.id +
          "/voter-management/external-voters"
      )
      .send(requestBody);

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(addExternalVoterSpy).toHaveBeenCalledTimes(1);
    expect(addExternalVoterSpy).toHaveBeenCalledWith({
      body: requestBody,
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("DELETE /:voteEventId/voter-management/external-voters/:externalVoterId", () => {
  let removeExternalVoterSpy;

  beforeAll(() => {
    removeExternalVoterSpy = jest.spyOn(
      voteEventHelpers,
      "removeExternalVoter"
    );
  });

  it("should call the helper function correctly", async () => {
    removeExternalVoterSpy.mockResolvedValueOnce(MOCK_EXTERNAL_VOTER_1);

    await supertest(app).delete(
      BASE_URL +
        "/" +
        MOCK_VOTE_EVENT_1_WITH_ID.id +
        "/voter-management/external-voters/" +
        MOCK_EXTERNAL_VOTER_1.id
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(removeExternalVoterSpy).toHaveBeenCalledTimes(1);
    expect(removeExternalVoterSpy).toHaveBeenCalledWith(
      MOCK_VOTE_EVENT_1_WITH_ID.id,
      MOCK_EXTERNAL_VOTER_1.id
    );

    assertApiResponse({ externalVoter: MOCK_EXTERNAL_VOTER_1 });
  });

  it("should call the error handler if an error is thrown", async () => {
    removeExternalVoterSpy.mockRejectedValueOnce(new Error("Test Error"));

    await supertest(app).delete(
      BASE_URL +
        "/" +
        MOCK_VOTE_EVENT_1_WITH_ID.id +
        "/voter-management/external-voters/" +
        MOCK_EXTERNAL_VOTER_1.id
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(removeExternalVoterSpy).toHaveBeenCalledTimes(1);
    expect(removeExternalVoterSpy).toHaveBeenCalledWith(
      MOCK_VOTE_EVENT_1_WITH_ID.id,
      MOCK_EXTERNAL_VOTER_1.id
    );

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("GET /:voteEventId/candidates", () => {
  let getAllCandidatesByVoteEventSpy;
  const returnValue = [MOCK_PROJECT_1_WITH_ID, MOCK_PROJECT_2_WITH_ID];

  beforeAll(() => {
    getAllCandidatesByVoteEventSpy = jest.spyOn(
      voteEventHelpers,
      "getAllCandidatesByVoteEvent"
    );
  });

  it("should call the helper function correctly", async () => {
    getAllCandidatesByVoteEventSpy.mockResolvedValueOnce(returnValue);

    await supertest(app).get(
      BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id + "/candidates"
    );

    expect(getAllCandidatesByVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(getAllCandidatesByVoteEventSpy).toHaveBeenCalledWith(1);

    assertApiResponse({ candidates: returnValue });
  });

  it("should call the error handler if an error is thrown", async () => {
    getAllCandidatesByVoteEventSpy.mockRejectedValueOnce(
      new Error("Test Error")
    );

    await supertest(app).get(
      BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id + "/candidates"
    );

    expect(getAllCandidatesByVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(getAllCandidatesByVoteEventSpy).toHaveBeenCalledWith(1);

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("POST /:voteEventId/candidates", () => {
  let addCandidateSpy;
  const requestBody = { projectId: 1 };

  beforeAll(() => {
    addCandidateSpy = jest.spyOn(voteEventHelpers, "addCandidate");
  });

  it("should call the helper function correctly", async () => {
    addCandidateSpy.mockResolvedValueOnce(MOCK_PROJECT_1_WITH_ID);

    await supertest(app)
      .post(BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id + "/candidates")
      .send(requestBody);

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(addCandidateSpy).toHaveBeenCalledTimes(1);
    expect(addCandidateSpy).toHaveBeenCalledWith({
      body: requestBody,
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    assertApiResponse({ candidate: MOCK_PROJECT_1_WITH_ID });
  });

  it("should call the error handler if an error is thrown", async () => {
    addCandidateSpy.mockRejectedValueOnce(new Error("Test Error"));

    await supertest(app)
      .post(BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id + "/candidates")
      .send(requestBody);

    expect(addCandidateSpy).toHaveBeenCalledTimes(1);
    expect(addCandidateSpy).toHaveBeenCalledWith({
      body: requestBody,
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("POST /:voteEventId/candidates/batch", () => {
  let addManyCandidatesSpy;
  const requestBody = {
    cohort: MOCK_PROJECT_1.cohortYear,
    achievement: MOCK_PROJECT_1.achievement,
  };

  beforeAll(() => {
    addManyCandidatesSpy = jest.spyOn(voteEventHelpers, "addManyCandidates");
  });

  it("should call the helper function correctly", async () => {
    addManyCandidatesSpy.mockResolvedValueOnce([
      MOCK_PROJECT_1_WITH_ID,
      MOCK_PROJECT_2_WITH_ID,
    ]);

    await supertest(app)
      .post(BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id + "/candidates/batch")
      .send(requestBody);

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(addManyCandidatesSpy).toHaveBeenCalledTimes(1);
    expect(addManyCandidatesSpy).toHaveBeenCalledWith({
      body: requestBody,
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    assertApiResponse({
      candidates: [MOCK_PROJECT_1_WITH_ID, MOCK_PROJECT_2_WITH_ID],
    });
  });

  it("should call the error handler if an error is thrown", async () => {
    addManyCandidatesSpy.mockRejectedValueOnce(new Error("Test Error"));

    await supertest(app)
      .post(BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id + "/candidates/batch")
      .send(requestBody);

    expect(addManyCandidatesSpy).toHaveBeenCalledTimes(1);
    expect(addManyCandidatesSpy).toHaveBeenCalledWith({
      body: requestBody,
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("DELETE /:voteEventId/candidates/:candidateId", () => {
  let removeCandidateSpy;

  beforeAll(() => {
    removeCandidateSpy = jest.spyOn(voteEventHelpers, "removeCandidate");
  });

  it("should call the helper function correctly", async () => {
    removeCandidateSpy.mockResolvedValueOnce(MOCK_PROJECT_1_WITH_ID);

    await supertest(app).delete(
      BASE_URL +
        "/" +
        MOCK_VOTE_EVENT_1_WITH_ID.id +
        "/candidates/" +
        MOCK_PROJECT_1_WITH_ID.id
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(removeCandidateSpy).toHaveBeenCalledTimes(1);
    expect(removeCandidateSpy).toHaveBeenCalledWith(
      MOCK_VOTE_EVENT_1_WITH_ID.id,
      MOCK_PROJECT_1_WITH_ID.id
    );

    assertApiResponse({ candidate: MOCK_PROJECT_1_WITH_ID });
  });

  it("should call the error handler if an error is thrown", async () => {
    removeCandidateSpy.mockRejectedValueOnce(new Error("Test Error"));

    await supertest(app).delete(
      BASE_URL +
        "/" +
        MOCK_VOTE_EVENT_1_WITH_ID.id +
        "/candidates/" +
        MOCK_PROJECT_1_WITH_ID.id
    );

    expect(removeCandidateSpy).toHaveBeenCalledTimes(1);
    expect(removeCandidateSpy).toHaveBeenCalledWith(
      MOCK_VOTE_EVENT_1_WITH_ID.id,
      MOCK_PROJECT_1_WITH_ID.id
    );

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("GET /:voteEventId/votes", () => {
  let getVotesByVoteEventAndVoterSpy;

  beforeAll(() => {
    getVotesByVoteEventAndVoterSpy = jest.spyOn(
      voteEventHelpers,
      "getVotesByVoteEventAndVoter"
    );
  });

  it("should call the helper function correctly", async () => {
    getVotesByVoteEventAndVoterSpy.mockResolvedValueOnce([
      { projectId: MOCK_PROJECT_1_WITH_ID.id },
    ]);

    await supertest(app).get(
      BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id + "/votes?userId=1"
    );

    expect(getVotesByVoteEventAndVoterSpy).toHaveBeenCalledTimes(1);
    expect(getVotesByVoteEventAndVoterSpy).toHaveBeenCalledWith(
      1,
      1,
      undefined
    );

    assertApiResponse({
      votes: [{ projectId: MOCK_PROJECT_1_WITH_ID.id }],
    });
  });

  it("should call the error handler if an error is thrown", async () => {
    getVotesByVoteEventAndVoterSpy.mockRejectedValueOnce(
      new Error("Test Error")
    );

    await supertest(app).get(
      BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id + "/votes?userId=1"
    );

    expect(getVotesByVoteEventAndVoterSpy).toHaveBeenCalledTimes(1);
    expect(getVotesByVoteEventAndVoterSpy).toHaveBeenCalledWith(
      1,
      1,
      undefined
    );

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("GET /:voteEventId/votes/all", () => {
  let getAllVotesByVoteEventSpy;

  beforeAll(() => {
    getAllVotesByVoteEventSpy = jest.spyOn(
      voteEventHelpers,
      "getAllVotesByVoteEvent"
    );
  });

  it("should call the helper function correctly", async () => {
    getAllVotesByVoteEventSpy.mockResolvedValueOnce([]);

    await supertest(app).get(
      BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id + "/votes/all"
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllVotesByVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(getAllVotesByVoteEventSpy).toHaveBeenCalledWith(
      MOCK_VOTE_EVENT_1_WITH_ID.id
    );

    assertApiResponse({
      votes: [],
    });
  });

  it("should call the error handler if an error is thrown", async () => {
    getAllVotesByVoteEventSpy.mockRejectedValueOnce(new Error("Test Error"));

    await supertest(app).get(
      BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id + "/votes/all"
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllVotesByVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(getAllVotesByVoteEventSpy).toHaveBeenCalledWith(
      MOCK_VOTE_EVENT_1_WITH_ID.id
    );

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("POST /:voteEventId/votes", () => {
  let addManyVotesSpy;
  const requestBody = { userId: 1, projectIds: [1, 2] };
  const response = [{ projectId: 1 }, { projectId: 2 }];

  beforeAll(() => {
    addManyVotesSpy = jest.spyOn(voteEventHelpers, "addManyVotes");
  });

  it("should call the helper function correctly", async () => {
    addManyVotesSpy.mockResolvedValueOnce(response);

    await supertest(app)
      .post(BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id + "/votes")
      .send(requestBody);

    expect(addManyVotesSpy).toHaveBeenCalledTimes(1);
    expect(addManyVotesSpy).toHaveBeenCalledWith({
      body: requestBody,
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    assertApiResponse({ votes: response });
  });

  it("should call the error handler if an error is thrown", async () => {
    addManyVotesSpy.mockRejectedValueOnce(new Error("Test Error"));

    await supertest(app)
      .post(BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id + "/votes")
      .send(requestBody);

    expect(addManyVotesSpy).toHaveBeenCalledTimes(1);
    expect(addManyVotesSpy).toHaveBeenCalledWith({
      body: requestBody,
      voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
    });

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("DELETE /:voteEventId/votes/:voteId", () => {
  let removeVoteSpy;
  const mockVoteId = 1;

  beforeAll(() => {
    removeVoteSpy = jest.spyOn(voteEventHelpers, "removeVote");
  });

  it("should call the helper function correctly", async () => {
    removeVoteSpy.mockResolvedValueOnce(MOCK_VOTE_1);

    await supertest(app).delete(
      BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id + "/votes/" + mockVoteId
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(removeVoteSpy).toHaveBeenCalledTimes(1);
    expect(removeVoteSpy).toHaveBeenCalledWith(mockVoteId);

    assertApiResponse({ vote: MOCK_VOTE_1 });
  });

  it("should call the error handler if an error is thrown", async () => {
    removeVoteSpy.mockRejectedValueOnce(new Error("Test Error"));

    await supertest(app).delete(
      BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id + "/votes/" + mockVoteId
    );

    expect(removeVoteSpy).toHaveBeenCalledTimes(1);
    expect(removeVoteSpy).toHaveBeenCalledWith(mockVoteId);

    assertRouteErrorHandler(new Error("Test Error"));
  });
});

describe("GET /:voteEventId/results", () => {
  let getResultsByVoteEventSpy;
  const returnValue = {
    rank: 1,
    percentage: 66.67,
    project: {
      ...MOCK_PROJECT_1_WITH_ID,
      achievement: MOCK_PROJECT_1_WITH_ID.achievement as AchievementLevel,
    },
    votes: 2,
    points: 2,
  };

  beforeAll(() => {
    getResultsByVoteEventSpy = jest.spyOn(
      voteEventHelpers,
      "getResultsByVoteEvent"
    );
  });

  it("should call the helper function correctly", async () => {
    getResultsByVoteEventSpy.mockResolvedValueOnce([returnValue]);

    await supertest(app).get(
      BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id + "/results"
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getResultsByVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(getResultsByVoteEventSpy).toHaveBeenCalledWith(
      MOCK_VOTE_EVENT_1_WITH_ID.id
    );

    assertApiResponse({ results: [returnValue] });
  });

  it("should call the error handler if an error is thrown", async () => {
    getResultsByVoteEventSpy.mockRejectedValueOnce(new Error("Test Error"));

    await supertest(app).get(
      BASE_URL + "/" + MOCK_VOTE_EVENT_1_WITH_ID.id + "/results"
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getResultsByVoteEventSpy).toHaveBeenCalledTimes(1);
    expect(getResultsByVoteEventSpy).toHaveBeenCalledWith(
      MOCK_VOTE_EVENT_1_WITH_ID.id
    );

    assertRouteErrorHandler(new Error("Test Error"));
  });
});
