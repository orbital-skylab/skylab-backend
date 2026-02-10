/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  getOneProjectById,
  getProjectsViaRoleIds,
} from "../../src/helpers/projects.helper";
import * as projectModel from "../../src/models/projects.db";
import {
  MOCK_PROJECT_ARTEMIS_2024,
  MOCK_PROJECT_MENTOR_ONLY,
  MOCK_PROJECT_ADVISER_ONLY,
  MOCK_PROJECT_ALL_NULL_RELATIONSHIPS,
} from "../../__mocks__/publicProjects.mocks";
import { SkylabError } from "../../src/errors/SkylabError";

/**
 * Unit tests for project data retrieval functions
 *
 * - getOneProjectById: fetches a single project by ID with parsed user data
 * - getProjectsViaRoleIds: fetches projects by student/adviser/mentor IDs
 */

jest.mock("../../src/models/projects.db");

const mockedFindUniqueProjectWithUserData =
  projectModel.findUniqueProjectWithUserData as jest.MockedFunction<
    typeof projectModel.findUniqueProjectWithUserData
  >;
const mockedFindManyProjectsWithUserData =
  projectModel.findManyProjectsWithUserData as jest.MockedFunction<
    typeof projectModel.findManyProjectsWithUserData
  >;

afterEach(() => {
  jest.resetAllMocks();
});

describe("getOneProjectById", () => {
  it("fetches and parses project by ID correctly", async () => {
    mockedFindUniqueProjectWithUserData.mockResolvedValue(
      MOCK_PROJECT_ARTEMIS_2024 as any
    );

    const result = await getOneProjectById(1);

    expect(mockedFindUniqueProjectWithUserData).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(result).toHaveProperty("id", 1);
    expect(result.students[0]).not.toHaveProperty("password");
  });

  it("handles null relationships", async () => {
    mockedFindUniqueProjectWithUserData.mockResolvedValue(
      MOCK_PROJECT_ALL_NULL_RELATIONSHIPS as any
    );

    const result = await getOneProjectById(11);

    expect(result.mentor).toBeUndefined();
    expect(result.adviser).toBeUndefined();
    expect(result.students).toEqual([]);
  });

  it("propagates error when project not found", async () => {
    mockedFindUniqueProjectWithUserData.mockRejectedValue(
      new SkylabError("Project was not found", 400)
    );

    await expect(getOneProjectById(999)).rejects.toThrow(
      "Project was not found"
    );
  });
});

describe("getProjectsViaRoleIds", () => {
  it("queries projects by studentId", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([
      MOCK_PROJECT_ARTEMIS_2024,
    ] as any);

    const result = await getProjectsViaRoleIds({ studentId: 1 });

    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith({
      where: {
        students: { some: { id: 1 } },
        adviserId: undefined,
        mentorId: undefined,
      },
    });
    expect(result).toHaveLength(1);
  });

  it("queries projects by adviserId", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([
      MOCK_PROJECT_ARTEMIS_2024,
    ] as any);

    const result = await getProjectsViaRoleIds({ adviserId: 1 });

    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith({
      where: {
        students: undefined,
        adviserId: 1,
        mentorId: undefined,
      },
    });
    expect(result).toHaveLength(1);
  });

  it("queries projects by mentorId", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([
      MOCK_PROJECT_MENTOR_ONLY,
    ] as any);

    const result = await getProjectsViaRoleIds({ mentorId: 1 });

    expect(mockedFindManyProjectsWithUserData).toHaveBeenCalledWith({
      where: {
        students: undefined,
        adviserId: undefined,
        mentorId: 1,
      },
    });
    expect(result).toHaveLength(1);
  });

  it("handles mixed relationship types correctly", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([
      MOCK_PROJECT_ARTEMIS_2024, // both adviser and mentor
      MOCK_PROJECT_ADVISER_ONLY, // adviser only
      MOCK_PROJECT_MENTOR_ONLY, // mentor only
    ] as any);

    const result = await getProjectsViaRoleIds({ studentId: 1 });

    expect(result).toHaveLength(3);
    expect(result[0].adviser).toBeDefined();
    expect(result[0].mentor).toBeDefined();
    expect(result[1].adviser).toBeDefined();
    expect(result[1].mentor).toBeUndefined();
    expect(result[2].mentor).toBeDefined();
    expect(result[2].adviser).toBeUndefined();
  });

  it("returns empty array when no projects match", async () => {
    mockedFindManyProjectsWithUserData.mockResolvedValue([] as any);

    const result = await getProjectsViaRoleIds({ studentId: 999 });

    expect(result).toEqual([]);
  });
});
