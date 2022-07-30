import { Adviser, Project } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import { findUniqueAdviserWithProjectData } from "src/models/advisers.db";
import { findManyDeadlines, findManyEvaluations } from "src/models/deadline.db";
import { findManyRelationsWithFromToProjectData } from "src/models/relations.db";
import { findFirstSubmission } from "src/models/submissions.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

export async function getDeadlinesByAdviserId(adviserId: number) {
  const adviser = await findUniqueAdviserWithProjectData({
    where: { id: adviserId },
  });

  if (adviser.projects.length == 0) {
    throw new SkylabError(
      "This adviser is not in charge of any projects, and hence has no deadlines!",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const pDeadlines = [
    getEvaluationsByAdviser(adviser),
    getFeedbacksByAdviser(adviser),
  ];

  const deadlines = (await Promise.all(pDeadlines)).flat();
  return deadlines;
}

export async function getEvaluationsByAdviser(
  adviser: Adviser & { projects: Project[] }
) {
  const { cohortYear, projects } = adviser;
  const cohortEvaluations = await findManyEvaluations({
    where: { cohortYear: cohortYear, type: "Evaluation" },
  });

  const evaluationSubmissions = cohortEvaluations.map(async (evaluation) => {
    const requiredEvaluationSubmissions = await Promise.all(
      projects.map(async (project) => {
        if (!evaluation.evaluating || !evaluation.evaluatingMilestoneId) {
          throw new SkylabError(
            "Evaluation missing metadata",
            HttpStatusCode.INTERNAL_SERVER_ERROR
          );
        }

        const { id: toProjectId } = project;

        const pSubmission = findFirstSubmission({
          where: {
            deadlineId: evaluation.id,
            fromUserId: adviser.userId,
            toProjectId: toProjectId,
          },
        });

        const pProjectSubmission = findFirstSubmission({
          where: {
            deadlineId: evaluation.evaluatingMilestoneId,
            fromProjectId: toProjectId,
            isDraft: false,
          },
          select: { id: true },
        });

        const [submission, projectSubmission] = await Promise.all([
          pSubmission,
          pProjectSubmission,
        ]);

        return {
          deadline: evaluation,
          toProject: {
            ...project,
            submissionId: projectSubmission ? projectSubmission.id : undefined,
          },
          submission: submission ? submission : undefined,
        };
      })
    );
    return requiredEvaluationSubmissions;
  });
  return (await Promise.all(evaluationSubmissions)).flat();
}

export async function getFeedbacksByAdviser(
  adviser: Adviser & { projects: Project[] }
) {
  const { cohortYear, projects } = adviser;
  const cohortFeedbacks = await findManyDeadlines({
    where: { cohortYear: cohortYear, type: "Feedback" },
  });

  const feedbackSubmissions = cohortFeedbacks.map(async (feedback) => {
    const requiredFeedbackSubmissions = await Promise.all(
      projects.map(async (project) => {
        const { id: toProjectId } = project;
        const submission = await findFirstSubmission({
          where: {
            deadlineId: feedback.id,
            fromUserId: adviser.userId,
            toProjectId: toProjectId,
          },
        });

        return {
          deadline: feedback,
          toProject: project,
          submission: submission ? submission : undefined,
        };
      })
    );

    return requiredFeedbackSubmissions;
  });
  return (await Promise.all(feedbackSubmissions)).flat();
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
        const submission = await findFirstSubmission({
          where: { deadlineId: deadline.id, fromProjectId: project.id },
        });
        return {
          fromProject: project,
          submission: submission ? submission : undefined,
        };
      });
      return {
        deadline: deadline,
        submissions: await Promise.all(milestoneSubmissions),
      };
    } else if (deadline.type == "Evaluation") {
      const evaluationSubmissions = relations.map(async (relation) => {
        const submission = await findFirstSubmission({
          where: {
            deadlineId: deadline.id,
            fromProjectId: relation.fromProjectId,
            toProjectId: relation.toProjectId,
          },
        });
        return {
          fromProject: relation.fromProject,
          toProject: relation.toProject,
          submission: submission ? submission : undefined,
        };
      });
      return {
        deadline: deadline,
        submissions: await Promise.all(evaluationSubmissions),
      };
    } else if (deadline.type == "Feedback") {
      const feedbackSubmissions = adviser.projects.map(async (project) => {
        const submission = await findFirstSubmission({
          where: {
            deadlineId: deadline.id,
            fromProjectId: project.id,
            toUserId: adviser.userId,
          },
        });
        return {
          fromProject: project,
          submission: submission ? submission : undefined,
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
