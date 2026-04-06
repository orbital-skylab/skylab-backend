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

import authorizeAdmin from "../../src/middleware/authorizeAdmin";
import app from "../../src/server";
import * as DashboardAdminHelpers from "../../src/helpers/dashboard.admin.helper";
import * as utils from "../../src/utils/ApiResponseWrapper";

const BASE_URL = "/api/dashboard/administrator/team-submissions/collated";

let apiResponseWrapperSpy;
let routeErrorHandlerSpy;

jest.mock("../../src/middleware/authorizeAdmin", () => ({
  __esModule: true,
  default: jest.fn(async (_1, _res, next: NextFunction) => {
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

describe("GET /team-submissions/collated route unit test", () => {
  let getCollatedMilestoneSubmissionsSpy;

  beforeAll(() => {
    getCollatedMilestoneSubmissionsSpy = jest.spyOn(
      DashboardAdminHelpers,
      "getCollatedMilestoneSubmissions"
    );
  });

  it("should call the collated helper with the validated query parameters", async () => {
    getCollatedMilestoneSubmissionsSpy.mockResolvedValueOnce({
      collated: [],
      evaluationCollated: [],
    });

    await supertest(app).get(
      `${BASE_URL}?cohortYear=2025&dropped=false&deadlineId=1&includeAnonymous=true&submissionStatus=Submitted&search=atlas`
    );

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getCollatedMilestoneSubmissionsSpy).toHaveBeenCalledTimes(1);
    expect(getCollatedMilestoneSubmissionsSpy).toHaveBeenCalledWith({
      cohortYear: 2025,
      dropped: "false",
      deadlineId: 1,
      includeAnonymous: "true",
      submissionStatus: "Submitted",
      search: "atlas",
    });
    expect(apiResponseWrapperSpy).toHaveBeenCalledWith(expect.any(Object), {
      collated: [],
      evaluationCollated: [],
    });
    expect(routeErrorHandlerSpy).not.toHaveBeenCalled();
  });

  it("should send route errors through the error handler", async () => {
    const error = new Error("Collated failed");
    getCollatedMilestoneSubmissionsSpy.mockRejectedValueOnce(error);

    await supertest(app).get(`${BASE_URL}?cohortYear=2025&dropped=false`);

    expect(authorizeAdmin).toHaveBeenCalledTimes(1);
    expect(getCollatedMilestoneSubmissionsSpy).toHaveBeenCalledTimes(1);
    expect(routeErrorHandlerSpy).toHaveBeenCalledWith(
      expect.any(Object),
      error
    );
  });
});
