/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  getPublicProjects,
  getPublicProjectsCount,
} from "../../src/helpers/projects.helper";
import * as projectModel from "../../src/models/projects.db";
import {
  MOCK_ALL_PROJECTS_UNSORTED,
  MOCK_PROJECT_ARTEMIS_2024,
  MOCK_PROJECT_ALL_NULL_RELATIONSHIPS,
  MOCK_PROJECT_MENTOR_ONLY,
  MOCK_PROJECT_ADVISER_ONLY,
} from "../../__mocks__/publicProjects.mocks";

/**
 * SSG Integration tests
 *
 * Tests the full pipeline: getPublicProjects() → sortByAchievementRank() → parseGetProjectInput()
 * Verifies end-to-end correctness of sorting, pagination, and data transformation
 * as consumed by the SSG build process.
 */

jest.mock("../../src/models/projects.db");

const mockedFindManyProjectsWithUserData =
  projectModel.findManyProjectsWithUserData as jest.MockedFunction<
    typeof projectModel.findManyProjectsWithUserData
  >;
const mockedCountProjects = projectModel.countProjects as jest.MockedFunction<
  typeof projectModel.countProjects
>;

afterEach(() => {
  jest.resetAllMocks();
});

describe("SSG Integration: Full Pipeline", () => {
  it("requests correct sort order from database", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue(
      MOCK_ALL_PROJECTS_UNSORTED as any
    );
    mockedCountProjects.mockResolvedValue(5);

    const result = await getPublicProjects({ limit: 100 });

    // Verify database was asked for cohortYear desc, id desc sort
    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ cohortYear: "desc" }, { id: "desc" }],
      })
    );
    expect(result.projects).toHaveLength(5);
  });

  it("paginates correctly with new sort order", async () => {
    // Mock that respects take/skip parameters
    mockedFindManyProjectsWithUserData.mockImplementation((query: any) => {
      const allData = MOCK_ALL_PROJECTS_UNSORTED as any;
      const take = query.take || allData.length;
      const skip = query.skip || 0;
      return Promise.resolve(allData.slice(skip, skip + take));
    });
    mockedCountProjects.mockResolvedValue(5);

    const page1 = await getPublicProjects({ page: 1, limit: 2 });
    expect(page1.projects).toHaveLength(2);
    expect(page1.page).toBe(1);

    const page2 = await getPublicProjects({ page: 2, limit: 2 });
    expect(page2.projects).toHaveLength(2);
    expect(page2.page).toBe(2);
  });

  it("removes passwords from all user objects in final output", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue(
      MOCK_ALL_PROJECTS_UNSORTED as any
    );
    mockedCountProjects.mockResolvedValue(5);

    const result = await getPublicProjects({ limit: 100 });

    result.projects.forEach((project) => {
      project.students.forEach((student) => {
        expect(student).not.toHaveProperty("password");
      });
      if (project.adviser)
        expect(project.adviser).not.toHaveProperty("password");
      if (project.mentor) expect(project.mentor).not.toHaveProperty("password");
    });
  });

  it("handles mixed relationship types across projects", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([
      MOCK_PROJECT_ARTEMIS_2024, // full relationships
      MOCK_PROJECT_MENTOR_ONLY, // mentor only
      MOCK_PROJECT_ADVISER_ONLY, // adviser only
      MOCK_PROJECT_ALL_NULL_RELATIONSHIPS, // no relationships
    ] as any);
    mockedCountProjects.mockResolvedValue(4);

    const result = await getPublicProjects({ limit: 100 });

    expect(result.projects).toHaveLength(4);
    result.projects.forEach((project) => {
      expect(project).toHaveProperty("id");
      expect(project).toHaveProperty("name");
      expect(project).toHaveProperty("students");
    });
  });

  it("getPublicProjectsCount and getPublicProjects return consistent metadata", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue(
      MOCK_ALL_PROJECTS_UNSORTED as any
    );
    mockedCountProjects.mockResolvedValue(5);

    const countResult = await getPublicProjectsCount(2);
    const projectsResult = await getPublicProjects({ limit: 2 });

    expect(countResult.totalPages).toBe(projectsResult.totalPages);
    expect(countResult.total).toBe(projectsResult.total);
  });

  it("simulates SSG page 1 with PAGE_SIZE=28", async () => {
    const manyProjects = Array.from({ length: 50 }, (_, i) => ({
      ...MOCK_PROJECT_ARTEMIS_2024,
      id: i + 1,
      cohortYear: 2024 - Math.floor(i / 10),
      achievement: ["Artemis", "Apollo", "Gemini", "Vostok"][i % 4] as any,
    }));

    mockedFindManyProjectsWithUserData.mockResolvedValue(manyProjects as any);
    mockedCountProjects.mockResolvedValue(50);

    const result = await getPublicProjects({ page: 1, limit: 28 });

    // Verify the database was asked to fetch with correct pagination parameters
    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 28,
        skip: 0, // page 1 = skip 0
      })
    );
    expect(result.total).toBe(50);
    expect(result.totalPages).toBe(2); // ceil(50/28)
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(28);
  });

  it("caps prebuilt pages at MAX_PAGES_TO_PREBUILD", async () => {
    mockedCountProjects.mockResolvedValue(1000);

    const countResult = await getPublicProjectsCount(28);
    const MAX_PAGES_TO_PREBUILD = 10;
    const pagesToBuild = Math.min(
      countResult.totalPages,
      MAX_PAGES_TO_PREBUILD
    );

    expect(countResult.totalPages).toBe(36); // ceil(1000/28)
    expect(pagesToBuild).toBe(10); // capped
  });

  it("SSG supports per-achievement level pagination", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([
      MOCK_PROJECT_ARTEMIS_2024,
    ] as any);
    mockedCountProjects.mockResolvedValue(15);

    const result = await getPublicProjects({
      page: 1,
      limit: 28,
      achievement: "Artemis",
    });

    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          achievement: "Artemis",
          hasDropped: false,
        }),
      })
    );
    expect(result.projects).toHaveLength(1);
    expect(result.total).toBe(15);
  });

  it("getPublicProjectsCount returns correct metadata per achievement level", async () => {
    mockedCountProjects.mockResolvedValue(42);

    const artemisCount = await getPublicProjectsCount(28, "artemis");
    expect(artemisCount.total).toBe(42);
    expect(artemisCount.totalPages).toBe(2); // ceil(42/28)

    mockedCountProjects.mockResolvedValue(20);
    const apolloCount = await getPublicProjectsCount(28, "apollo");
    expect(apolloCount.total).toBe(20);
    expect(apolloCount.totalPages).toBe(1); // ceil(20/28)
  });

  it("builds complete SSG path set for 4 achievement levels", async () => {
    const levels = ["artemis", "apollo", "gemini", "vostok"];
    const PAGES_PER_LEVEL = 10;

    let callCount = 0;
    mockedCountProjects.mockImplementation(() => {
      // Return enough projects to generate PAGES_PER_LEVEL pages
      callCount++;
      return Promise.resolve(28 * PAGES_PER_LEVEL);
    });

    const paths: string[] = [];
    for (const level of levels) {
      const countResult = await getPublicProjectsCount(28, level);
      const pagesToBuild = Math.min(countResult.totalPages, PAGES_PER_LEVEL);
      for (let p = 1; p <= pagesToBuild; p++) {
        paths.push(`/public-gallery/${level}/page/${p}`);
      }
    }

    expect(callCount).toBe(4); // One call per level
    expect(paths).toHaveLength(40); // 4 levels × 10 pages
    expect(paths[0]).toBe("/public-gallery/artemis/page/1");
    expect(paths[10]).toBe("/public-gallery/apollo/page/1");
    expect(paths[20]).toBe("/public-gallery/gemini/page/1");
    expect(paths[30]).toBe("/public-gallery/vostok/page/1");
  });
});
