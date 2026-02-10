/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { getManyProjectsWithFilter } from "../../src/helpers/projects.helper";
import * as projectModel from "../../src/models/projects.db";
import {
  MOCK_PROJECT_ARTEMIS_2024,
  MOCK_PROJECT_APOLLO_2024,
  MOCK_PROJECT_GEMINI_2024,
} from "../../__mocks__/publicProjects.mocks";

/**
 * Unit tests for getManyProjectsWithFilter
 *
 * This function filters projects based on query parameters:
 * - achievement: filter by achievement level
 * - cohortYear: filter by cohort year
 * - search: text search across project name, student/mentor/adviser names
 * - dropped: filter by dropped status
 * - limit/page: pagination
 */

jest.mock("../../src/models/projects.db");

const mockedFindManyProjectsWithUserData =
  projectModel.findManyProjectsWithUserData as jest.MockedFunction<
    typeof projectModel.findManyProjectsWithUserData
  >;

afterEach(() => {
  jest.resetAllMocks();
});

describe("getManyProjectsWithFilter", () => {
  it("returns all projects when no filters are applied", async () => {
    const allProjects = [
      MOCK_PROJECT_ARTEMIS_2024,
      MOCK_PROJECT_APOLLO_2024,
      MOCK_PROJECT_GEMINI_2024,
    ];
    mockedFindManyProjectsWithUserData.mockResolvedValue(allProjects as any);

    const result = await getManyProjectsWithFilter({});

    expect(result).toHaveLength(3);
    expect(result[0].students[0]).not.toHaveProperty("password");
  });

  it("passes achievement filter to the query", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([] as any);

    await getManyProjectsWithFilter({ achievement: "Artemis" });

    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ achievement: "Artemis" }),
      })
    );
  });

  it("converts string cohortYear to number", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([] as any);

    await getManyProjectsWithFilter({ cohortYear: "2024" as any });

    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ cohortYear: 2024 }),
      })
    );
  });

  it("passes hasDropped filter correctly", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([] as any);

    await getManyProjectsWithFilter({ dropped: "true" });

    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ hasDropped: true }),
      })
    );
  });

  it("builds OR query for search across multiple fields", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([] as any);

    await getManyProjectsWithFilter({ search: "Artemis" });

    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { name: { search: "Artemis" } },
            { students: { some: { user: { name: { search: "Artemis" } } } } },
            { mentor: { user: { name: { search: "Artemis" } } } },
            { adviser: { user: { name: { search: "Artemis" } } } },
          ],
        }),
      })
    );
  });

  it("calculates pagination with skip from limit and page", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([] as any);

    await getManyProjectsWithFilter({ limit: 10, page: 2 });

    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 20, // 10 * 2
        orderBy: { id: "asc" },
      })
    );
  });

  it("applies all filters and pagination together", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([] as any);

    await getManyProjectsWithFilter({
      achievement: "Artemis",
      cohortYear: 2024,
      search: "test",
      dropped: "false",
      limit: 5,
      page: 1,
    });

    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        skip: 5,
        where: expect.objectContaining({
          achievement: "Artemis",
          cohortYear: 2024,
          hasDropped: false,
          OR: expect.any(Array),
        }),
        orderBy: { id: "asc" },
      })
    );
  });

  it("returns empty array when no results match", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([] as any);

    const result = await getManyProjectsWithFilter({ achievement: "Artemis" });

    expect(result).toEqual([]);
  });
});
