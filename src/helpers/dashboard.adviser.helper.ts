import { DeadlineType, EvaluatorType, Prisma } from "@prisma/client";
import { SkylabError } from "../errors/SkylabError";
import { findUniqueAdviserWithProjectData } from "../models/advisers.db";
import { findManyDeadlines } from "../models/deadline.db";
import {
  findFirstNonDraftSubmission,
  findFirstSubmission,
  findManySubmissions,
} from "../models/submissions.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";

const canAdviserSubmit = (evaluatorType: EvaluatorType | null) =>
  !evaluatorType ||
  evaluatorType === EvaluatorType.Adviser ||
  evaluatorType === EvaluatorType.Both;

const canTeamSubmit = (evaluatorType: EvaluatorType | null) =>
  !evaluatorType ||
  evaluatorType === EvaluatorType.Team ||
  evaluatorType === EvaluatorType.Both;

export async function getDeadlinesByAdviserId(adviserId: number) {
  const adviser = await findUniqueAdviserWithProjectData({
    where: { id: adviserId },
  });

  const { projects } = adviser;

  if (projects.length == 0) {
    throw new SkylabError(
      "This adviser is not in charge of any projects, and hence has no deadlines!",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const deadlines = await findManyDeadlines({
    where: {
      cohortYear: adviser.cohortYear,
      type: { in: [DeadlineType.Evaluation, DeadlineType.Feedback] },
    },
    orderBy: { dueBy: "asc" },
  });
  const pDeadlinesOfAdviser = deadlines.map(async (deadline) => {
    if (deadline.type == "Evaluation") {
      if (!deadline.evaluatingMilestoneId) {
        throw new SkylabError(
          "Evaluation missing metadata",
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }

      if (!canAdviserSubmit(deadline.evaluatorType)) {
        return [];
      }

      const { evaluatingMilestoneId } = deadline;
      return await Promise.all(
        projects.map(async (project) => {
          const { id: toProjectId } = project;
          const pSubmission = findFirstSubmission({
            where: {
              deadlineId: deadline.id,
              fromUserId: adviser.userId,
              toProjectId: toProjectId,
            },
          });

          const pProjectSubmission = findFirstNonDraftSubmission({
            where: {
              deadlineId: evaluatingMilestoneId,
              fromProjectId: project.id,
            },
          });

          const [submission, projectSubmission] = await Promise.all([
            pSubmission,
            pProjectSubmission,
          ]);

          return {
            deadline: deadline,
            toProject: project,
            toProjectSubmission: projectSubmission ?? undefined,
            submission: submission ?? undefined,
          };
        })
      );
    } else {
      if (!canAdviserSubmit(deadline.evaluatorType)) {
        return [];
      }

      return await Promise.all(
        projects.map(async (project) => {
          const { id: toProjectId } = project;
          const submission = await findFirstNonDraftSubmission({
            where: {
              deadlineId: deadline.id,
              fromUserId: adviser.userId,
              toProjectId: toProjectId,
            },
          });

          return {
            deadline: deadline,
            toProject: project,
            submission: submission ? submission : undefined,
          };
        })
      );
    }
  });

  return (await Promise.all(pDeadlinesOfAdviser)).flat();
}

export async function getProjectSubmissionsViaAdviserId(adviserId: number) {
  const adviser = await findUniqueAdviserWithProjectData({
    where: { id: adviserId },
  });

  if (adviser.projects.length == 0) {
    throw new SkylabError(
      "This adviser is not in charge of any projects, and hence has no deadlines!",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const projectIds = adviser.projects.map(({ id }) => id);

  const cohortDeadlines = await findManyDeadlines({
    where: { cohortYear: adviser.cohortYear },
  });

  const pProjectSubmissions = cohortDeadlines.map(async (deadline) => {
    if (deadline.type == "Milestone") {
      const milestoneSubmissions = adviser.projects.map(async (project) => {
        const submission = await findFirstNonDraftSubmission({
          where: { deadlineId: deadline.id, fromProjectId: project.id },
        });
        return {
          fromProject: project,
          ...submission,
        };
      });
      return {
        deadline: deadline,
        submissions: await Promise.all(milestoneSubmissions),
      };
    } else if (deadline.type == "Evaluation") {
      if (!canTeamSubmit(deadline.evaluatorType)) {
        return {
          deadline: deadline,
          submissions: [],
        };
      }
      // Query submissions directly — survives EvaluationRelation deletion.
      const evaluationSubmissions = (await findManySubmissions({
        where: {
          deadlineId: deadline.id,
          fromProjectId: { in: projectIds },
          toProjectId: { not: null },
          isDraft: false,
        },
        include: { fromProject: true, toProject: true },
      })) as Prisma.SubmissionGetPayload<{
        include: { fromProject: true; toProject: true };
      }>[];
      return {
        deadline: deadline,
        submissions: evaluationSubmissions,
      };
    } else if (deadline.type == "Feedback") {
      if (!canTeamSubmit(deadline.evaluatorType)) {
        return {
          deadline: deadline,
          submissions: [],
        };
      }

      const feedbackSubmissions = adviser.projects.map(async (project) => {
        const submission = await findFirstNonDraftSubmission({
          where: {
            deadlineId: deadline.id,
            fromProjectId: project.id,
            toUserId: adviser.userId,
          },
        });
        return {
          fromProject: project,
          ...submission,
        };
      });
      return {
        deadline: deadline,
        submissions: await Promise.all(feedbackSubmissions),
      };
    }
  });

  return await Promise.all(pProjectSubmissions);
}
