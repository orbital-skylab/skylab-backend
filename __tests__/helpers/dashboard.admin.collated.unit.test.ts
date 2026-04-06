/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { prisma } from "../../src/client";
import {
  getCollatedMilestoneSubmissions,
  SubmissionStatusEnum,
} from "../../src/helpers/dashboard.admin.helper";
import * as DeadlineDb from "../../src/models/deadline.db";
import * as ProjectsDb from "../../src/models/projects.db";
import * as RelationsDb from "../../src/models/relations.db";

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

describe("getCollatedMilestoneSubmissions", () => {
  it("returns only the requested milestone question visibility while keeping evaluation questions", async () => {
    jest
      .spyOn(DeadlineDb, "findUniqueDeadlineWithQuestionsData")
      .mockResolvedValue({
        id: 1,
        name: "Milestone 1",
        dueBy: new Date("2026-03-01T00:00:00.000Z"),
        type: "Milestone",
        cohortYear: 2026,
        sections: [
          {
            id: 11,
            name: "Section 1",
            sectionNumber: 1,
            questions: [
              {
                id: 101,
                questionNumber: 1,
                question: "Public milestone question",
                desc: "",
                isAnonymous: false,
                isRequired: true,
                type: "ShortAnswer",
                urlType: null,
              },
              {
                id: 102,
                questionNumber: 2,
                question: "Anonymous milestone question",
                desc: "",
                isAnonymous: true,
                isRequired: false,
                type: "Paragraph",
                urlType: null,
              },
            ],
          },
        ],
      } as any);

    jest
      .spyOn(DeadlineDb, "findManyDeadlinesWithQuestionsData")
      .mockResolvedValue([
        {
          id: 2,
          name: "Milestone 1 Evaluation",
          dueBy: new Date("2026-03-05T00:00:00.000Z"),
          type: "Evaluation",
          cohortYear: 2026,
          evaluatorType: "Team",
          sections: [
            {
              id: 21,
              name: "Evaluation Section",
              sectionNumber: 1,
              questions: [
                {
                  id: 201,
                  questionNumber: 1,
                  question: "Named evaluation question",
                  desc: "",
                  isAnonymous: false,
                  isRequired: true,
                  type: "ShortAnswer",
                  urlType: null,
                },
                {
                  id: 202,
                  questionNumber: 2,
                  question: "Anonymous evaluation question",
                  desc: "",
                  isAnonymous: true,
                  isRequired: false,
                  type: "Paragraph",
                  urlType: null,
                },
              ],
            },
          ],
        } as any,
      ]);

    jest
      .spyOn(ProjectsDb, "findManyProjectsWithUserData")
      .mockResolvedValueOnce([
        {
          id: 1,
          name: "Project Atlas",
          teamName: "Team Atlas",
          cohortYear: 2026,
          hasDropped: false,
        },
      ] as any)
      .mockResolvedValueOnce([] as any);

    jest
      .spyOn(RelationsDb, "findManyRelationsForEvaluations")
      .mockResolvedValue([
        {
          id: 51,
          fromProjectId: 3,
          toProjectId: 1,
          fromProject: {
            id: 3,
            name: "Project Beta",
            teamName: "Team Beta",
          },
          toProject: {
            id: 1,
            name: "Project Atlas",
            teamName: "Team Atlas",
          },
        },
      ] as any);

    const submissionFindManySpy = jest.spyOn(prisma.submission, "findMany");

    submissionFindManySpy.mockResolvedValueOnce([
      {
        id: 301,
        deadlineId: 1,
        fromProjectId: 1,
        updatedAt: new Date("2026-02-28T12:00:00.000Z"),
        answers: [{ questionId: 101, answer: "Ready" }],
      },
    ] as any);

    submissionFindManySpy.mockResolvedValueOnce([
      {
        id: 401,
        deadlineId: 2,
        fromProjectId: 3,
        toProjectId: 1,
        updatedAt: new Date("2026-03-04T12:00:00.000Z"),
        answers: [
          { questionId: 201, answer: "Clear progress" },
          { questionId: 202, answer: "Private note" },
        ],
      },
    ] as any);

    const result = await getCollatedMilestoneSubmissions({
      cohortYear: 2026,
      deadlineId: 1,
      dropped: false,
      includeAnonymous: false,
    });

    expect(result.collated).toHaveLength(1);
    expect(
      result.collated[0].questions.map((question) => question.questionId)
    ).toEqual([101]);
    expect(result.collated[0].questions[0].responses[0].answer).toBe("Ready");

    expect(result.evaluationCollated).toHaveLength(1);
    expect(
      result.evaluationCollated[0].questions.map(
        (question) => question.questionId
      )
    ).toEqual([201, 202]);
    expect(result.evaluationCollated[0].questions[1].responses[0].answer).toBe(
      "Private note"
    );
  });

  it("returns empty collated question sets when the cohort has no matching projects", async () => {
    jest
      .spyOn(DeadlineDb, "findManyDeadlinesWithQuestionsData")
      .mockResolvedValue([
        {
          id: 1,
          name: "Milestone 1",
          dueBy: new Date("2026-03-01T00:00:00.000Z"),
          type: "Milestone",
          cohortYear: 2026,
          sections: [
            {
              id: 11,
              name: "Section 1",
              sectionNumber: 1,
              questions: [
                {
                  id: 101,
                  questionNumber: 1,
                  question: "Question 1",
                  desc: "",
                  isAnonymous: false,
                  isRequired: true,
                  type: "ShortAnswer",
                  urlType: null,
                },
              ],
            },
          ],
        } as any,
      ]);

    jest
      .spyOn(ProjectsDb, "findManyProjectsWithUserData")
      .mockResolvedValue([] as any);

    const result = await getCollatedMilestoneSubmissions({
      cohortYear: 2026,
      dropped: false,
      submissionStatus: SubmissionStatusEnum.UNSUBMITTED,
    });

    expect(result.collated).toEqual([
      {
        deadline: expect.objectContaining({
          id: 1,
          name: "Milestone 1",
          type: "Milestone",
        }),
        questions: [],
      },
    ]);
    expect(result.evaluationCollated).toEqual([]);
  });
});
