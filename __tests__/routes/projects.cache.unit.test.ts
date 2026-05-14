/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, jest } from "@jest/globals";
import express, { NextFunction } from "express";
import supertest from "supertest";
import projectRouter, {
  getProjectGalleryCacheKey,
  isCacheableDefaultGalleryFetch,
} from "../../src/routes/projects";
import * as ProjectHelpers from "../../src/helpers/projects.helper";

jest.mock("../../src/helpers/projects.helper", () => ({
  createProject: jest.fn(),
  deleteOneProjectById: jest.fn(),
  editProjectDataByProjectID: jest.fn(),
  getManyProjectsLean: jest.fn(),
  getManyProjectsWithFilter: jest.fn(),
  getOneProjectById: jest.fn(),
  getProjectsViaRoleIds: jest.fn(),
  getPublicProjectCohortYears: jest.fn(),
  getPublicProjects: jest.fn(),
  getPublicProjectsCount: jest.fn(),
}));

jest.mock("../../src/middleware/authorizeAdmin", () => ({
  __esModule: true,
  default: jest.fn(async (_req: any, _res: any, next: NextFunction) => {
    next();
  }),
}));

jest.mock("../../src/middleware/authorizeAdviserOfProject", () => ({
  __esModule: true,
  default: jest.fn(async (_req: any, _res: any, next: NextFunction) => {
    next();
  }),
}));

const app = express();
app.use(express.json());
app.use("/api/projects", projectRouter);

const mockedGetManyProjectsWithFilter =
  ProjectHelpers.getManyProjectsWithFilter as jest.MockedFunction<
    typeof ProjectHelpers.getManyProjectsWithFilter
  >;

describe("project gallery cache", () => {
  it("uses cohortYear as part of the default gallery cache key", () => {
    const cohort2025Query = {
      cohortYear: "2025",
      achievement: "Artemis",
      limit: "16",
      page: "0",
      dropped: "false",
    };
    const cohort2026Query = { ...cohort2025Query, cohortYear: "2026" };

    expect(isCacheableDefaultGalleryFetch(cohort2025Query)).toBe(true);
    expect(getProjectGalleryCacheKey(cohort2025Query)).not.toBe(
      getProjectGalleryCacheKey(cohort2026Query)
    );
  });

  it("does not serve one cohort's cached projects for another cohort", async () => {
    const cohort2025Projects = [{ id: 1, cohortYear: 2025 }];
    const cohort2026Projects = [{ id: 2, cohortYear: 2026 }];

    mockedGetManyProjectsWithFilter
      .mockResolvedValueOnce(cohort2025Projects as any)
      .mockResolvedValueOnce(cohort2026Projects as any);

    const firstResponse = await supertest(app).get(
      "/api/projects?cohortYear=2025&achievement=Artemis&limit=16&page=0&dropped=false"
    );
    const secondResponse = await supertest(app).get(
      "/api/projects?cohortYear=2026&achievement=Artemis&limit=16&page=0&dropped=false"
    );
    const cachedFirstResponse = await supertest(app).get(
      "/api/projects?cohortYear=2025&achievement=Artemis&limit=16&page=0&dropped=false"
    );

    expect(mockedGetManyProjectsWithFilter).toHaveBeenCalledTimes(2);
    expect(firstResponse.body.projects).toEqual(cohort2025Projects);
    expect(secondResponse.body.projects).toEqual(cohort2026Projects);
    expect(cachedFirstResponse.body.projects).toEqual(cohort2025Projects);
  });
});
