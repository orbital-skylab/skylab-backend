import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { AchievementLevel, DeadlineType, EvaluatorType } from "@prisma/client";
import { getDeadlinesByAdviserId } from "../../src/helpers/dashboard.adviser.helper";
import { getDeadlinesByStudentId } from "../../src/helpers/dashboard.student.helper";
import { duplicateDeadlineByDeadlineId } from "../../src/helpers/deadline.helper";
import * as AdvisersDb from "../../src/models/advisers.db";
import * as DeadlinesDb from "../../src/models/deadline.db";
import * as RelationsDb from "../../src/models/relations.db";
import * as StudentsDb from "../../src/models/students.db";
import * as SubmissionsDb from "../../src/models/submissions.db";

const adviserUser = {
  id: 11,
  name: "Adviser One",
  email: "adviser@example.com",
  password: "password",
};

const project = {
  id: 21,
  name: "Project One",
  teamName: "Team One",
  cohortYear: 2026,
  achievement: AchievementLevel.Vostok,
  adviserId: 31,
  mentorId: null,
  proposalPdf: null,
  posterUrl: null,
  videoUrl: null,
  hasDropped: false,
  adviser: {
    id: 31,
    userId: adviserUser.id,
    cohortYear: 2026,
    nusnetId: "e0123456",
    matricNo: "A0123456A",
    user: adviserUser,
  },
};

const buildFeedbackDeadline = (evaluatorType: EvaluatorType | null) => ({
  id: 41,
  name: "Feedback One",
  cohortYear: 2026,
  createdOn: new Date("2026-01-01T00:00:00.000Z"),
  dueBy: new Date("2026-02-01T00:00:00.000Z"),
  desc: null,
  type: DeadlineType.Feedback,
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  evaluatingMilestoneId: null,
  evaluating: null,
  evaluatorType,
});

const arrangeDashboardData = (evaluatorType: EvaluatorType | null) => {
  jest
    .spyOn(StudentsDb, "findUniqueStudentWithProjectWithAdviserUserData")
    .mockResolvedValue({
      id: 51,
      userId: 61,
      projectId: project.id,
      cohortYear: 2026,
      nusnetId: "e0765432",
      matricNo: "A0765432A",
      project,
    } as never);
  jest.spyOn(AdvisersDb, "findUniqueAdviserWithProjectData").mockResolvedValue({
    ...project.adviser,
    projects: [project],
  } as never);
  jest
    .spyOn(DeadlinesDb, "findManyDeadlines")
    .mockResolvedValue([buildFeedbackDeadline(evaluatorType)]);
  jest
    .spyOn(RelationsDb, "findManyRelationsWithFromToProjectData")
    .mockResolvedValue([]);
  jest.spyOn(SubmissionsDb, "findFirstSubmission").mockResolvedValue(null);
  jest
    .spyOn(SubmissionsDb, "findFirstNonDraftSubmission")
    .mockResolvedValue(null);
};

describe("Feedback evaluator task visibility", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("shows Team feedback only to students", async () => {
    arrangeDashboardData(EvaluatorType.Team);

    const [studentDeadlines, adviserDeadlines] = await Promise.all([
      getDeadlinesByStudentId(51),
      getDeadlinesByAdviserId(31),
    ]);

    expect(studentDeadlines).toHaveLength(1);
    expect(adviserDeadlines).toEqual([]);
  });

  it("shows Adviser feedback only to advisers", async () => {
    arrangeDashboardData(EvaluatorType.Adviser);

    const [studentDeadlines, adviserDeadlines] = await Promise.all([
      getDeadlinesByStudentId(51),
      getDeadlinesByAdviserId(31),
    ]);

    expect(studentDeadlines).toEqual([]);
    expect(adviserDeadlines).toHaveLength(1);
  });

  it("shows Both feedback to students and advisers", async () => {
    arrangeDashboardData(EvaluatorType.Both);

    const [studentDeadlines, adviserDeadlines] = await Promise.all([
      getDeadlinesByStudentId(51),
      getDeadlinesByAdviserId(31),
    ]);

    expect(studentDeadlines).toHaveLength(1);
    expect(adviserDeadlines).toHaveLength(1);
  });

  it("shows Feedback with no evaluator type to both roles", async () => {
    arrangeDashboardData(null);

    const [studentDeadlines, adviserDeadlines] = await Promise.all([
      getDeadlinesByStudentId(51),
      getDeadlinesByAdviserId(31),
    ]);

    expect(studentDeadlines).toHaveLength(1);
    expect(adviserDeadlines).toHaveLength(1);
  });
});

describe("Feedback evaluator metadata", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("preserves evaluator type when duplicating a Feedback deadline", async () => {
    const feedbackDeadline = buildFeedbackDeadline(EvaluatorType.Team);
    jest
      .spyOn(DeadlinesDb, "findUniqueDeadline")
      .mockResolvedValue(feedbackDeadline);
    const createDeadlineSpy = jest
      .spyOn(DeadlinesDb, "createOneDeadline")
      .mockResolvedValue({
        ...feedbackDeadline,
        id: 42,
        name: `Copy of ${feedbackDeadline.name}`,
      });

    await duplicateDeadlineByDeadlineId(feedbackDeadline.id, 2027);

    expect(createDeadlineSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: DeadlineType.Feedback,
          evaluatorType: EvaluatorType.Team,
        }),
      })
    );
  });
});
