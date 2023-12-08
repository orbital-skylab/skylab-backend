import { DeadlineType } from "@prisma/client";
import { SkylabError } from "../errors/SkylabError";
import { findUniqueAdviserWithProjectData } from "../models/advisers.db";
import { findManyDeadlines } from "../models/deadline.db";
import { findManyRelationsWithFromToProjectData } from "../models/relations.db";
import {
  findFirstNonDraftSubmission,
  findFirstSubmission,
} from "../models/submissions.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";

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

  const relations = await findManyRelationsWithFromToProjectData({
    where: { fromProjectId: { in: projectIds } },
  });

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
      const evaluationSubmissions = relations.map(async (relation) => {
        const submission = await findFirstNonDraftSubmission({
          where: {
            deadlineId: deadline.id,
            fromProjectId: relation.fromProjectId,
            toProjectId: relation.toProjectId,
          },
        });
        return {
          fromProject: relation.fromProject,
          toProject: relation.toProject,
          ...submission,
        };
      });
      return {
        deadline: deadline,
        submissions: await Promise.all(evaluationSubmissions),
      };
    } else if (deadline.type == "Feedback") {
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
