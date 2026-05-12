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
import * as ProjectHelpers from "../../src/helpers/projects.helper";
import app from "../../src/server";
import * as utils from "../../src/utils/ApiResponseWrapper";

/**
 * Unit tests for projects routes related to SSG / public gallery
 *
 * Tests endpoints:
 * - GET /api/projects/public      - Paginated public projects
 * - GET /api/projects/public/count - Count of public projects
 */

const BASE_URL = "/api/projects";

let apiResponseWrapperSpy: any;
let routeErrorHandlerSpy: any;

const assertApiResponse = (calledWith: any) => {
  expect(apiResponseWrapperSpy).toHaveBeenCalledTimes(1);
  expect(routeErrorHandlerSpy).not.toHaveBeenCalled();
  expect(apiResponseWrapperSpy).toHaveBeenCalledWith(
    expect.any(Object),
    calledWith
  );
};

const assertRouteErrorHandler = () => {
  expect(routeErrorHandlerSpy).toHaveBeenCalledTimes(1);
};

// Mock middleware to bypass auth
jest.mock("../../src/middleware/authorizeAdmin", () => ({
  __esModule: true,
  default: jest.fn(async (_1: any, _res: any, next: NextFunction) => {
    next();
  }),
}));

jest.mock("../../src/middleware/authorizeAdviserOfProject", () => ({
  __esModule: true,
  default: jest.fn(async (_1: any, _res: any, next: NextFunction) => {
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

describe("GET /projects/public", () => {
  let getPublicProjectsSpy: any;

  beforeAll(() => {
    getPublicProjectsSpy = jest.spyOn(ProjectHelpers, "getPublicProjects");
  });

  it("calls getPublicProjects with default pagination when no query params", async () => {
    const mockResult = {
      projects: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
    getPublicProjectsSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(`${BASE_URL}/public`);

    expect(getPublicProjectsSpy).toHaveBeenCalledTimes(1);
    expect(getPublicProjectsSpy).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
    });
    assertApiResponse(mockResult);
  });

  it("passes page and limit query parameters", async () => {
    const mockResult = {
      projects: [],
      total: 0,
      page: 2,
      pageSize: 28,
      totalPages: 0,
    };
    getPublicProjectsSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(`${BASE_URL}/public?page=2&limit=28`);

    expect(getPublicProjectsSpy).toHaveBeenCalledWith({
      page: 2,
      limit: 28,
    });
    assertApiResponse(mockResult);
  });

  it("defaults page to 1 for invalid page parameter", async () => {
    const mockResult = {
      projects: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
    getPublicProjectsSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(`${BASE_URL}/public?page=-1`);

    expect(getPublicProjectsSpy).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
    });
  });

  it("defaults page to 1 for non-numeric page parameter", async () => {
    const mockResult = {
      projects: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
    getPublicProjectsSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(`${BASE_URL}/public?page=abc`);

    expect(getPublicProjectsSpy).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
    });
  });

  it("defaults limit to 20 for invalid limit parameter", async () => {
    const mockResult = {
      projects: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
    getPublicProjectsSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(`${BASE_URL}/public?limit=0`);

    expect(getPublicProjectsSpy).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
    });
  });

  it("defaults limit to 20 when limit exceeds max (100)", async () => {
    const mockResult = {
      projects: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
    getPublicProjectsSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(`${BASE_URL}/public?limit=200`);

    expect(getPublicProjectsSpy).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
    });
  });

  it("accepts limit at the maximum boundary (100)", async () => {
    const mockResult = {
      projects: [],
      total: 0,
      page: 1,
      pageSize: 100,
      totalPages: 0,
    };
    getPublicProjectsSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(`${BASE_URL}/public?limit=100`);

    expect(getPublicProjectsSpy).toHaveBeenCalledWith({
      page: 1,
      limit: 100,
    });
  });

  it("accepts limit at the minimum boundary (1)", async () => {
    const mockResult = {
      projects: [],
      total: 0,
      page: 1,
      pageSize: 1,
      totalPages: 0,
    };
    getPublicProjectsSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(`${BASE_URL}/public?limit=1`);

    expect(getPublicProjectsSpy).toHaveBeenCalledWith({
      page: 1,
      limit: 1,
    });
  });

  it("returns 200 status on success", async () => {
    const mockResult = {
      projects: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
    getPublicProjectsSpy.mockResolvedValueOnce(mockResult);

    const response = await supertest(app).get(`${BASE_URL}/public`);

    expect(response.status).toBe(200);
  });

  it("handles errors from getPublicProjects", async () => {
    const error = new Error("Database error");
    getPublicProjectsSpy.mockRejectedValueOnce(error);

    await supertest(app).get(`${BASE_URL}/public`);

    assertRouteErrorHandler();
  });

  it("passes achievement query parameter with pagination", async () => {
    const mockResult = {
      projects: [],
      total: 0,
      page: 1,
      pageSize: 28,
      totalPages: 0,
    };
    getPublicProjectsSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(
      `${BASE_URL}/public?page=1&limit=28&achievement=artemis`
    );

    expect(getPublicProjectsSpy).toHaveBeenCalledWith({
      page: 1,
      limit: 28,
      achievement: "artemis",
    });
    assertApiResponse(mockResult);
  });

  it("passes cohortYear with achievement and pagination", async () => {
    const mockResult = {
      projects: [],
      total: 0,
      page: 1,
      pageSize: 28,
      totalPages: 0,
    };
    getPublicProjectsSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(
      `${BASE_URL}/public?page=1&limit=28&achievement=artemis&cohortYear=2026`
    );

    expect(getPublicProjectsSpy).toHaveBeenCalledWith({
      page: 1,
      limit: 28,
      achievement: "artemis",
      cohortYear: 2026,
    });
    assertApiResponse(mockResult);
  });

  it("passes achievement query parameter with default pagination", async () => {
    const mockResult = {
      projects: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
    getPublicProjectsSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(`${BASE_URL}/public?achievement=apollo`);

    expect(getPublicProjectsSpy).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      achievement: "apollo",
    });
    assertApiResponse(mockResult);
  });

  it("handles different achievement levels in filter", async () => {
    const mockResult = {
      projects: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    };
    getPublicProjectsSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(`${BASE_URL}/public?achievement=vostok`);

    expect(getPublicProjectsSpy).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      achievement: "vostok",
    });
  });
});

describe("GET /projects/public/count", () => {
  let getPublicProjectsCountSpy: any;

  beforeAll(() => {
    getPublicProjectsCountSpy = jest.spyOn(
      ProjectHelpers,
      "getPublicProjectsCount"
    );
  });

  it("calls getPublicProjectsCount with default limit when no query params", async () => {
    const mockResult = { total: 50, totalPages: 3 };
    getPublicProjectsCountSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(`${BASE_URL}/public/count`);

    expect(getPublicProjectsCountSpy).toHaveBeenCalledTimes(1);
    expect(getPublicProjectsCountSpy).toHaveBeenCalledWith(20, undefined);
    assertApiResponse(mockResult);
  });

  it("passes limit query parameter", async () => {
    const mockResult = { total: 50, totalPages: 2 };
    getPublicProjectsCountSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(`${BASE_URL}/public/count?limit=28`);

    expect(getPublicProjectsCountSpy).toHaveBeenCalledWith(28, undefined);
    assertApiResponse(mockResult);
  });

  it("defaults limit to 20 for invalid limit parameter", async () => {
    const mockResult = { total: 50, totalPages: 3 };
    getPublicProjectsCountSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(`${BASE_URL}/public/count?limit=-5`);

    expect(getPublicProjectsCountSpy).toHaveBeenCalledWith(20, undefined);
  });

  it("defaults limit to 20 when limit exceeds max (100)", async () => {
    const mockResult = { total: 50, totalPages: 3 };
    getPublicProjectsCountSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(`${BASE_URL}/public/count?limit=999`);

    expect(getPublicProjectsCountSpy).toHaveBeenCalledWith(20, undefined);
  });

  it("returns 200 status on success", async () => {
    const mockResult = { total: 50, totalPages: 3 };
    getPublicProjectsCountSpy.mockResolvedValueOnce(mockResult);

    const response = await supertest(app).get(`${BASE_URL}/public/count`);

    expect(response.status).toBe(200);
  });

  it("handles errors from getPublicProjectsCount", async () => {
    const error = new Error("Database error");
    getPublicProjectsCountSpy.mockRejectedValueOnce(error);

    await supertest(app).get(`${BASE_URL}/public/count`);

    assertRouteErrorHandler();
  });

  it("passes achievement query parameter with limit", async () => {
    const mockResult = { total: 20, totalPages: 1 };
    getPublicProjectsCountSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(
      `${BASE_URL}/public/count?limit=28&achievement=artemis`
    );

    expect(getPublicProjectsCountSpy).toHaveBeenCalledWith(28, "artemis");
    assertApiResponse(mockResult);
  });

  it("passes cohortYear with achievement and limit", async () => {
    const mockResult = { total: 20, totalPages: 1 };
    getPublicProjectsCountSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(
      `${BASE_URL}/public/count?limit=28&achievement=artemis&cohortYear=2026`
    );

    expect(getPublicProjectsCountSpy).toHaveBeenCalledWith(28, "artemis", 2026);
    assertApiResponse(mockResult);
  });

  it("passes achievement query parameter with default limit", async () => {
    const mockResult = { total: 30, totalPages: 2 };
    getPublicProjectsCountSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(`${BASE_URL}/public/count?achievement=apollo`);

    expect(getPublicProjectsCountSpy).toHaveBeenCalledWith(20, "apollo");
    assertApiResponse(mockResult);
  });

  it("handles different achievement levels", async () => {
    const mockResult = { total: 15, totalPages: 1 };
    getPublicProjectsCountSpy.mockResolvedValueOnce(mockResult);

    await supertest(app).get(`${BASE_URL}/public/count?achievement=vostok`);

    expect(getPublicProjectsCountSpy).toHaveBeenCalledWith(20, "vostok");
  });
});
