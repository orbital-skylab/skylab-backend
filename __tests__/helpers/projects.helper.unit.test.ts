/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  getPublicProjects,
  getPublicProjectsCount,
  sortByAchievementRank,
  buildPaginationMetadata,
} from "../../src/helpers/projects.helper";
import * as projectModel from "../../src/models/projects.db";
import {
  MOCK_ALL_PROJECTS_UNSORTED,
  MOCK_PROJECT_ARTEMIS_2024,
} from "../../__mocks__/publicProjects.mocks";

// Mock the database model functions
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

/**
 * Tests for extracted helper functions (SRP principle)
 */
describe("sortByAchievementRank", () => {
  it("sorts by cohort year descending then achievement rank ascending", () => {
    const projects = [
      { cohortYear: 2022, achievement: "Vostok" as const },
      { cohortYear: 2024, achievement: "Vostok" as const },
      { cohortYear: 2024, achievement: "Artemis" as const },
      { cohortYear: 2023, achievement: "Apollo" as const },
    ];

    const sorted = sortByAchievementRank(projects);

    expect(sorted.map((p) => [p.cohortYear, p.achievement])).toEqual([
      [2024, "Artemis"],
      [2024, "Vostok"],
      [2023, "Apollo"],
      [2022, "Vostok"],
    ]);
  });

  it("handles null achievement by placing at end", () => {
    const projects = [
      { cohortYear: 2024, achievement: null },
      { cohortYear: 2024, achievement: "Artemis" as const },
    ];

    const sorted = sortByAchievementRank(projects);

    expect(sorted[0].achievement).toBe("Artemis");
    expect(sorted[1].achievement).toBeNull();
  });
});

describe("buildPaginationMetadata", () => {
  it("calculates totalPages correctly", () => {
    const result = buildPaginationMetadata(100, 1, 28);

    expect(result.total).toBe(100);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(28);
    expect(result.totalPages).toBe(4); // Math.ceil(100/28)
  });

  it("returns 0 totalPages for empty total", () => {
    const result = buildPaginationMetadata(0, 1, 20);

    expect(result.totalPages).toBe(0);
  });
});

describe("getPublicProjectsCount", () => {
  it("returns total and totalPages for non-dropped projects", async () => {
    mockedCountProjects.mockResolvedValue(100);

    const result = await getPublicProjectsCount(28);

    expect(result.total).toBe(100);
    expect(result.totalPages).toBe(4);
    expect(mockedCountProjects).toHaveBeenCalledWith({ hasDropped: false });
  });

  it("returns 0 totalPages for empty database", async () => {
    mockedCountProjects.mockResolvedValue(0);

    const result = await getPublicProjectsCount(28);

    expect(result.totalPages).toBe(0);
  });

  it("filters by achievement level when provided", async () => {
    mockedCountProjects.mockResolvedValue(50);

    const result = await getPublicProjectsCount(28, "artemis");

    expect(result.total).toBe(50);
    expect(result.totalPages).toBe(2); // Math.ceil(50/28)
    expect(mockedCountProjects).toHaveBeenCalledWith({
      hasDropped: false,
      achievement: "Artemis",
    });
  });

  it("validates achievement enum value conversion", async () => {
    mockedCountProjects.mockResolvedValue(25);

    await getPublicProjectsCount(28, "vostok");

    expect(mockedCountProjects).toHaveBeenCalledWith({
      hasDropped: false,
      achievement: "Vostok",
    });
  });

  it("handles invalid achievement value gracefully", async () => {
    mockedCountProjects.mockResolvedValue(100);

    const result = await getPublicProjectsCount(28, "invalid_level");

    expect(mockedCountProjects).toHaveBeenCalledWith({
      hasDropped: false,
    });
    expect(result.total).toBe(100);
  });
});

describe("getPublicProjects", () => {
  it("returns paginated sorted projects with correct metadata", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue(
      MOCK_ALL_PROJECTS_UNSORTED as any
    );
    mockedCountProjects.mockResolvedValue(5);

    const result = await getPublicProjects({ page: 1, limit: 20 });

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(1);
    expect(result.projects).toHaveLength(5);
  });

  it("requests projects with correct sort order from database", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue(
      MOCK_ALL_PROJECTS_UNSORTED as any
    );
    mockedCountProjects.mockResolvedValue(5);

    const result = await getPublicProjects();

    // Verify the database was asked to sort by cohortYear desc, id desc
    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ cohortYear: "desc" }, { id: "desc" }],
      })
    );
    expect(result.projects).toHaveLength(5);
  });

  it("filters projects by achievement level", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([
      MOCK_PROJECT_ARTEMIS_2024,
    ] as any);
    mockedCountProjects.mockResolvedValue(1);

    const result = await getPublicProjects({ achievement: "Artemis" });

    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          achievement: "Artemis",
          hasDropped: false,
        }),
      })
    );
    expect(result.projects).toHaveLength(1);
  });

  it("applies pagination with achievement filter", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([
      MOCK_PROJECT_ARTEMIS_2024,
    ] as any);
    mockedCountProjects.mockResolvedValue(50);

    const result = await getPublicProjects({
      page: 2,
      limit: 28,
      achievement: "Apollo",
    });

    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 28,
        skip: 28, // (2-1) * 28
        where: expect.objectContaining({
          achievement: "Apollo",
        }),
      })
    );
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(2); // Math.ceil(50/28)
  });

  it("returns all projects when achievement is not specified", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue(
      MOCK_ALL_PROJECTS_UNSORTED as any
    );
    mockedCountProjects.mockResolvedValue(5);

    const result = await getPublicProjects();

    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          achievement: undefined,
          hasDropped: false,
        }),
      })
    );
    expect(result.projects).toHaveLength(5);
  });

  it("only queries non-dropped projects", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([]);
    mockedCountProjects.mockResolvedValue(0);

    await getPublicProjects();

    expect(mockedCountProjects).toHaveBeenCalledWith({ hasDropped: false });
    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hasDropped: false },
      })
    );
  });

  it("removes passwords from all user data", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([
      MOCK_PROJECT_ARTEMIS_2024,
    ] as any);
    mockedCountProjects.mockResolvedValue(1);

    const result = await getPublicProjects();

    const project = result.projects[0];
    expect(project.students[0]).not.toHaveProperty("password");
  });

  it("handles empty project list", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([]);
    mockedCountProjects.mockResolvedValue(0);

    const result = await getPublicProjects();

    expect(result.projects).toHaveLength(0);
    expect(result.totalPages).toBe(0);
  });
});
