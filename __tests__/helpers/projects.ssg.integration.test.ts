/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  getPublicProjects,
  getPublicProjectsCount,
} from "../../src/helpers/projects.helper";
import * as projectModel from "../../src/models/projects.db";
import {
  MOCK_ALL_PROJECTS_UNSORTED,
  MOCK_ALL_PROJECTS_SORTED,
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
  it("sorts projects correctly through full pipeline", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue(
      MOCK_ALL_PROJECTS_UNSORTED as any
    );
    mockedCountProjects.mockResolvedValue(5);

    const result = await getPublicProjects({ limit: 100 });

    const resultIds = result.projects.map((p) => p.id);
    const expectedIds = MOCK_ALL_PROJECTS_SORTED.map((p) => p.id);
    expect(resultIds).toEqual(expectedIds);
  });

  it("paginates correctly after sorting", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue(
      MOCK_ALL_PROJECTS_UNSORTED as any
    );
    mockedCountProjects.mockResolvedValue(5);

    const page1 = await getPublicProjects({ page: 1, limit: 2 });
    expect(page1.projects.map((p) => p.id)).toEqual([
      MOCK_ALL_PROJECTS_SORTED[0].id,
      MOCK_ALL_PROJECTS_SORTED[1].id,
    ]);

    const page2 = await getPublicProjects({ page: 2, limit: 2 });
    expect(page2.projects.map((p) => p.id)).toEqual([
      MOCK_ALL_PROJECTS_SORTED[2].id,
      MOCK_ALL_PROJECTS_SORTED[3].id,
    ]);
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
      achievement: ["Artemis", "Apollo", "Gemini", "Vostok"][i % 4],
    }));

    mockedFindManyProjectsWithUserData.mockResolvedValue(manyProjects as any);
    mockedCountProjects.mockResolvedValue(50);

    const result = await getPublicProjects({ page: 1, limit: 28 });

    expect(result.projects).toHaveLength(28);
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
});
