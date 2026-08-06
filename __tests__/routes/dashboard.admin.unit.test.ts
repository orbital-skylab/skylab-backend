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
  MOCK_SUBMISSION,
  MOCK_PROJECT_WITH_SUBMISSION,
  MOCK_PROJECT_WITHOUT_SUBMISSION,
  MOCK_PROJECT_DROPPED,
} from "../../__mocks__/dashboard.admin.mocks";
import * as DashboardAdminHelpers from "../../src/helpers/dashboard.admin.helper";
import authorizeAdmin from "../../src/middleware/authorizeAdmin";
import app from "../../src/server";
import * as utils from "../../src/utils/ApiResponseWrapper";
import * as CohortValidatorHelpers from "../../src/validators/helper/cohort.validator.helper";

const BASE_URL = "/api/dashboard/administrator";

let apiResponseWrapperSpy;
let routeErrorHandlerSpy;

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
  default: jest.fn(async (_1, _res, next: NextFunction) => {
    next();
  }),
}));

jest.mock("../../src/validators/helper/cohort.validator.helper", () => ({
  checkCohortExists: jest.fn(() => Promise.resolve(true)),
}));

beforeAll(() => {
  apiResponseWrapperSpy = jest.spyOn(utils, "apiResponseWrapper");
  routeErrorHandlerSpy = jest.spyOn(utils, "routeErrorHandler");
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("GET /team-submissions route unit test", () => {
  let getAllSubmissions;

  beforeAll(() => {
    getAllSubmissions = jest.spyOn(DashboardAdminHelpers, "getSubmissions");
  });

  it("should call the helper function correctly to get all submissions", async () => {
    getAllSubmissions.mockResolvedValueOnce([
      MOCK_PROJECT_WITH_SUBMISSION,
      MOCK_PROJECT_WITHOUT_SUBMISSION,
    ]);
    await supertest(app).get(
      `${BASE_URL}/team-submissions?cohortYear=${MOCK_SUBMISSION.cohortYear}&dropped=${MOCK_SUBMISSION.dropped}`
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledWith({
      cohortYear: MOCK_SUBMISSION.cohortYear,
      dropped: MOCK_SUBMISSION.dropped,
    });

    assertApiResponse({
      submissions: [
        MOCK_PROJECT_WITH_SUBMISSION,
        MOCK_PROJECT_WITHOUT_SUBMISSION,
      ],
    });
  });

  it("should call the helper function correctly to get all submissions with search query", async () => {
    const search = MOCK_PROJECT_WITH_SUBMISSION.fromProject.name.split(" ")[0];
    getAllSubmissions.mockResolvedValueOnce([MOCK_PROJECT_WITH_SUBMISSION]);
    await supertest(app).get(
      `${BASE_URL}/team-submissions?cohortYear=${MOCK_SUBMISSION.cohortYear}&dropped=${MOCK_SUBMISSION.dropped}&search=${search}`
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledWith({
      cohortYear: MOCK_SUBMISSION.cohortYear,
      dropped: MOCK_SUBMISSION.dropped,
      search,
    });

    assertApiResponse({ submissions: [MOCK_PROJECT_WITH_SUBMISSION] });
  });

  it("should call the helper function correctly to get all submissions with pagination", async () => {
    const page = 1;
    const limit = 10;
    getAllSubmissions.mockResolvedValueOnce([
      MOCK_PROJECT_WITH_SUBMISSION,
      MOCK_PROJECT_WITHOUT_SUBMISSION,
    ]);
    await supertest(app).get(
      `${BASE_URL}/team-submissions?cohortYear=${MOCK_SUBMISSION.cohortYear}&dropped=${MOCK_SUBMISSION.dropped}&page=${page}&limit=${limit}`
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledWith({
      cohortYear: MOCK_SUBMISSION.cohortYear,
      dropped: MOCK_SUBMISSION.dropped,
      page,
      limit,
    });

    assertApiResponse({
      submissions: [
        MOCK_PROJECT_WITH_SUBMISSION,
        MOCK_PROJECT_WITHOUT_SUBMISSION,
      ],
    });
  });

  it("should call the helper function correctly to get all submissions with search query and pagination", async () => {
    const search = MOCK_PROJECT_WITH_SUBMISSION.fromProject.name.split(" ")[0];
    const page = 1;
    const limit = 10;
    getAllSubmissions.mockResolvedValueOnce([MOCK_PROJECT_WITH_SUBMISSION]);
    await supertest(app).get(
      `${BASE_URL}/team-submissions?cohortYear=${MOCK_SUBMISSION.cohortYear}&dropped=${MOCK_SUBMISSION.dropped}&search=${search}&page=${page}&limit=${limit}`
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledWith({
      cohortYear: MOCK_SUBMISSION.cohortYear,
      dropped: MOCK_SUBMISSION.dropped,
      search,
      page,
      limit,
    });

    assertApiResponse({ submissions: [MOCK_PROJECT_WITH_SUBMISSION] });
  });

  it("should call the helper function correctly to get milestone submissions", async () => {
    const deadlineId = 1;
    getAllSubmissions.mockResolvedValueOnce([
      MOCK_PROJECT_WITH_SUBMISSION,
      MOCK_PROJECT_WITHOUT_SUBMISSION,
    ]);
    await supertest(app).get(
      `${BASE_URL}/team-submissions?cohortYear=${MOCK_SUBMISSION.cohortYear}&dropped=${MOCK_SUBMISSION.dropped}&deadlineId=${deadlineId}`
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledWith({
      cohortYear: MOCK_SUBMISSION.cohortYear,
      dropped: MOCK_SUBMISSION.dropped,
      deadlineId,
    });

    assertApiResponse({
      submissions: [
        MOCK_PROJECT_WITH_SUBMISSION,
        MOCK_PROJECT_WITHOUT_SUBMISSION,
      ],
    });
  });

  it("should handle errors correctly", async () => {
    const errorMessage = "Error occurred";
    getAllSubmissions.mockRejectedValueOnce(new Error(errorMessage));
    await supertest(app).get(
      `${BASE_URL}/team-submissions?cohortYear=${MOCK_SUBMISSION.cohortYear}&dropped=${MOCK_SUBMISSION.dropped}`
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledWith({
      cohortYear: MOCK_SUBMISSION.cohortYear,
      dropped: MOCK_SUBMISSION.dropped,
    });

    assertRouteErrorHandler(new Error(errorMessage));
  });

  it("should return empty submissions if no data found", async () => {
    getAllSubmissions.mockResolvedValueOnce([]);
    await supertest(app).get(
      `${BASE_URL}/team-submissions?cohortYear=${MOCK_SUBMISSION.cohortYear}&dropped=${MOCK_SUBMISSION.dropped}`
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledWith({
      cohortYear: MOCK_SUBMISSION.cohortYear,
      dropped: MOCK_SUBMISSION.dropped,
    });

    assertApiResponse({ submissions: [] });
  });

  it("should call the helper function correctly to get all submissions with different cohort year", async () => {
    const cohortYear = 2024;
    jest
      .spyOn(CohortValidatorHelpers, "checkCohortExists")
      .mockResolvedValueOnce(true);
    getAllSubmissions.mockResolvedValueOnce([
      MOCK_PROJECT_WITH_SUBMISSION,
      MOCK_PROJECT_WITHOUT_SUBMISSION,
    ]);
    await supertest(app).get(
      `${BASE_URL}/team-submissions?cohortYear=${cohortYear}&dropped=${MOCK_SUBMISSION.dropped}`
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledWith({
      cohortYear,
      dropped: MOCK_SUBMISSION.dropped,
    });

    assertApiResponse({
      submissions: [
        MOCK_PROJECT_WITH_SUBMISSION,
        MOCK_PROJECT_WITHOUT_SUBMISSION,
      ],
    });
  });

  it("should call the helper function correctly to get all submissions with different dropped status", async () => {
    const dropped = "true";
    getAllSubmissions.mockResolvedValueOnce([MOCK_PROJECT_DROPPED]);
    await supertest(app).get(
      `${BASE_URL}/team-submissions?cohortYear=${MOCK_SUBMISSION.cohortYear}&dropped=${dropped}`
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledWith({
      cohortYear: MOCK_SUBMISSION.cohortYear,
      dropped,
    });

    assertApiResponse({ submissions: [MOCK_PROJECT_DROPPED] });
  });

  it("should call the helper function correctly to get all submissions with different page and limit", async () => {
    const page = 2;
    const limit = 5;
    getAllSubmissions.mockResolvedValueOnce([MOCK_PROJECT_WITHOUT_SUBMISSION]);
    await supertest(app).get(
      `${BASE_URL}/team-submissions?cohortYear=${MOCK_SUBMISSION.cohortYear}&dropped=${MOCK_SUBMISSION.dropped}&page=${page}&limit=${limit}`
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledWith({
      cohortYear: MOCK_SUBMISSION.cohortYear,
      dropped: MOCK_SUBMISSION.dropped,
      page,
      limit,
    });

    assertApiResponse({ submissions: [MOCK_PROJECT_WITHOUT_SUBMISSION] });
  });

  it("should call the helper function correctly to get all submissions with different deadlineId", async () => {
    const deadlineId = 2;
    getAllSubmissions.mockResolvedValueOnce([MOCK_PROJECT_WITHOUT_SUBMISSION]);
    await supertest(app).get(
      `${BASE_URL}/team-submissions?cohortYear=${MOCK_SUBMISSION.cohortYear}&dropped=${MOCK_SUBMISSION.dropped}&deadlineId=${deadlineId}`
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledWith({
      cohortYear: MOCK_SUBMISSION.cohortYear,
      dropped: MOCK_SUBMISSION.dropped,
      deadlineId,
    });

    assertApiResponse({ submissions: [MOCK_PROJECT_WITHOUT_SUBMISSION] });
  });

  it("should handle invalid query parameters correctly", async () => {
    await supertest(app).get(
      `${BASE_URL}/team-submissions?cohortYear=invalid&dropped=${MOCK_SUBMISSION.dropped}`
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).not.toHaveBeenCalled();
    expect(apiResponseWrapperSpy).not.toHaveBeenCalled();
  });

  it("should call the helper function correctly to get all submissions with multiple filters", async () => {
    const search = "search";
    const page = 1;
    const limit = 10;
    const deadlineId = 1;
    getAllSubmissions.mockResolvedValueOnce([MOCK_PROJECT_WITHOUT_SUBMISSION]);
    await supertest(app).get(
      `${BASE_URL}/team-submissions?cohortYear=${MOCK_SUBMISSION.cohortYear}&dropped=${MOCK_SUBMISSION.dropped}&search=${search}&page=${page}&limit=${limit}&deadlineId=${deadlineId}`
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledTimes(1);
    expect(getAllSubmissions).toHaveBeenCalledWith({
      cohortYear: MOCK_SUBMISSION.cohortYear,
      dropped: MOCK_SUBMISSION.dropped,
      search,
      page,
      limit,
      deadlineId,
    });

    assertApiResponse({ submissions: [MOCK_PROJECT_WITHOUT_SUBMISSION] });
  });
});

describe("GET /feedback route unit test", () => {
  let getFeedbackSubmissions;

  beforeAll(() => {
    getFeedbackSubmissions = jest.spyOn(
      DashboardAdminHelpers,
      "getFeedbackSubmissions"
    );
  });

  it("should call the helper function correctly to get feedback submissions", async () => {
    const deadlineId = 4;
    getFeedbackSubmissions.mockResolvedValueOnce([
      MOCK_PROJECT_WITH_SUBMISSION,
      MOCK_PROJECT_WITHOUT_SUBMISSION,
    ]);

    await supertest(app).get(
      `${BASE_URL}/feedback?cohortYear=${MOCK_SUBMISSION.cohortYear}&dropped=${MOCK_SUBMISSION.dropped}&deadlineId=${deadlineId}`
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getFeedbackSubmissions).toHaveBeenCalledTimes(1);
    expect(getFeedbackSubmissions).toHaveBeenCalledWith({
      cohortYear: MOCK_SUBMISSION.cohortYear,
      dropped: MOCK_SUBMISSION.dropped,
      deadlineId,
    });

    assertApiResponse({
      submissions: [
        MOCK_PROJECT_WITH_SUBMISSION,
        MOCK_PROJECT_WITHOUT_SUBMISSION,
      ],
    });
  });
});
