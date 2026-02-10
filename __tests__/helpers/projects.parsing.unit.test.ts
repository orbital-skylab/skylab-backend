/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "@jest/globals";
import {
  parseGetProjectInput,
  parseStudentInProject,
  parseAdviserInProject,
  parseMentorInProject,
} from "../../src/helpers/projects.helper";
import {
  MOCK_STUDENT_1,
  MOCK_ADVISER,
  MOCK_MENTOR,
  MOCK_PROJECT_ARTEMIS_2024,
  MOCK_PROJECT_NULL_ACHIEVEMENT,
  MOCK_PROJECT_ALL_NULL_RELATIONSHIPS,
  MOCK_PROJECT_TWO_STUDENTS,
} from "../../__mocks__/publicProjects.mocks";

/**
 * Unit tests for project parsing functions
 *
 * These functions transform raw Prisma project data into API-safe output by:
 * - Removing passwords from user objects
 * - Restructuring role IDs (id → studentId/adviserId/mentorId)
 * - Handling null/undefined relationships
 */

describe("parseStudentInProject", () => {
  it("removes password and restructures student data correctly", () => {
    const result = parseStudentInProject(MOCK_STUDENT_1 as any);

    expect(result).not.toHaveProperty("password");
    expect(result).toHaveProperty("studentId", MOCK_STUDENT_1.id);
    expect(result).toHaveProperty("id", MOCK_STUDENT_1.user.id);
    expect(result.name).toBe(MOCK_STUDENT_1.user.name);
    expect(result).not.toHaveProperty("user");
  });
});

describe("parseAdviserInProject", () => {
  it("removes password and restructures adviser data correctly", () => {
    const result = parseAdviserInProject(MOCK_ADVISER as any);

    expect(result).not.toHaveProperty("password");
    expect(result).toHaveProperty("adviserId", MOCK_ADVISER.id);
    expect(result).toHaveProperty("id", MOCK_ADVISER.user.id);
    expect(result).not.toHaveProperty("user");
  });
});

describe("parseMentorInProject", () => {
  it("removes password and restructures mentor data correctly", () => {
    const result = parseMentorInProject(MOCK_MENTOR as any);

    expect(result).not.toHaveProperty("password");
    expect(result).toHaveProperty("mentorId", MOCK_MENTOR.id);
    expect(result).toHaveProperty("id", MOCK_MENTOR.user.id);
    expect(result).not.toHaveProperty("user");
  });
});

describe("parseGetProjectInput", () => {
  it("parses project with all relationships correctly", () => {
    const result = parseGetProjectInput(MOCK_PROJECT_ARTEMIS_2024 as any);

    expect(result).toHaveProperty("id", MOCK_PROJECT_ARTEMIS_2024.id);
    expect(result).toHaveProperty("name", MOCK_PROJECT_ARTEMIS_2024.name);

    // Students parsed correctly
    result.students.forEach((student) => {
      expect(student).not.toHaveProperty("password");
      expect(student).toHaveProperty("studentId");
    });

    // Adviser parsed correctly
    expect(result.adviser).toBeDefined();
    expect(result.adviser).not.toHaveProperty("password");
    expect(result.adviser).toHaveProperty("adviserId");

    // Mentor parsed correctly
    expect(result.mentor).toBeDefined();
    expect(result.mentor).not.toHaveProperty("password");
    expect(result.mentor).toHaveProperty("mentorId");
  });

  it("handles null relationships correctly", () => {
    const result = parseGetProjectInput(
      MOCK_PROJECT_ALL_NULL_RELATIONSHIPS as any
    );

    expect(result.mentor).toBeUndefined();
    expect(result.adviser).toBeUndefined();
    expect(result.students).toEqual([]);
  });

  it("handles project with null achievement", () => {
    const result = parseGetProjectInput(MOCK_PROJECT_NULL_ACHIEVEMENT as any);

    expect(result.achievement).toBeNull();
    expect(result).toHaveProperty("id");
  });

  it("handles multiple students correctly", () => {
    const result = parseGetProjectInput(MOCK_PROJECT_TWO_STUDENTS as any);

    expect(result.students).toHaveLength(2);
    result.students.forEach((student) => {
      expect(student).not.toHaveProperty("password");
      expect(student).toHaveProperty("studentId");
    });
  });
});
