import { Adviser, Project } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import { findUniqueAdviserWithProjectData } from "src/models/advisers.db";
import { findManyDeadlines, findManyEvaluations } from "src/models/deadline.db";
import {
  findFirstSubmission,
  findManySubmissions,
} from "src/models/submissions.db";
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

  const pDeadlineSubmissions = [
    getProjectMilestoneSubmissionsByAdviser(adviser, projectIds),
    getProjectEvaluationSubmissionsByAdviser(adviser, projectIds),
    getProjectFeedbackSubmissionsByAdviser(adviser, projectIds),
  ];

  return (await Promise.all(pDeadlineSubmissions)).flat();
}

export async function getProjectMilestoneSubmissionsByAdviser(
  adviser: Adviser & { projects: Project[] },
  projectIds: number[]
) {
  const { cohortYear } = adviser;

  const milestones = await findManyDeadlines({
    where: { cohortYear: cohortYear, type: "Milestone" },
  });

  const projectMilestoneSubmissions = milestones.map(async (milestone) => {
    const submissions = await findManySubmissions({
      where: {
        deadlineId: milestone.id,
        fromProjectId: { in: projectIds },
        isDraft: false,
      },
      include: { fromProject: true },
    });

    return {
      deadline: milestone,
      submissions: submissions,
    };
  });

  return await Promise.all(projectMilestoneSubmissions);
}

export async function getProjectEvaluationSubmissionsByAdviser(
  adviser: Adviser & { projects: Project[] },
  projectIds: number[]
) {
  const { cohortYear } = adviser;

  const evaluations = await findManyEvaluations({
    where: { cohortYear: cohortYear, type: "Evaluation" },
  });

  const projectEvaluationSubmissions = evaluations.map(async (evaluation) => {
    if (!evaluation.evaluating) {
      throw new SkylabError(
        "Evaluation missing metadata",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
    const submissions = await findManySubmissions({
      where: {
        deadlineId: evaluation.id,
        fromProjectId: { in: projectIds },
        isDraft: false,
      },
      include: { toProject: true },
    });
    return {
      deadline: evaluation,
      submissions: submissions,
    };
  });

  return await Promise.all(projectEvaluationSubmissions);
}

export async function getProjectFeedbackSubmissionsByAdviser(
  adviser: Adviser & { projects: Project[] },
  projectIds: number[]
) {
  const { cohortYear } = adviser;

  const feedbacks = await findManyDeadlines({
    where: { cohortYear: cohortYear, type: "Feedback" },
  });

  const projectFeedbackSubmissions = feedbacks.map(async (feedback) => {
    const submissions = await findManySubmissions({
      where: {
        deadlineId: feedback.id,
        fromProjectId: { in: projectIds },
        isDraft: false,
      },
      include: { toProject: true, toUser: true },
    });
    return {
      deadline: feedback,
      submissions: submissions,
    };
  });

  return await Promise.all(projectFeedbackSubmissions);
}
