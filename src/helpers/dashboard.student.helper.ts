import { Adviser, Project, Student } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import { findManyDeadlines, findManyEvaluations } from "src/models/deadline.db";
import { findUniqueProject } from "src/models/projects.db";
import { findManyRelations } from "src/models/relations.db";
import { findUniqueStudentWithProjectWithAdviserData } from "src/models/students.db";
import {
  findFirstSubmission,
  findManySubmissions,
} from "src/models/submissions.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

export async function getDeadlinesByStudentId(studentId: number) {
  const student = await findUniqueStudentWithProjectWithAdviserData({
    where: { id: studentId },
  });
  const pDeadlines = [
    getMilestonesByStudent(student),
    getEvaluationsByStudent(student),
    getFeedbacksByStudent(student),
  ];
  const deadlines = (await Promise.all(pDeadlines)).flat();
  return deadlines;
}

export async function getFeedbacksByStudent(
  student: Student & { project: (Project & { adviser: Adviser | null }) | null }
) {
  if (!student.project) {
    throw new SkylabError(
      "This student is not part of a project, and hence has no deadlines!",
      HttpStatusCode.BAD_REQUEST
    );
  }

  if (!student.project.adviser) {
    throw new SkylabError(
      "This student in in a project with no advisers, and hence is not required to submit feedback!",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const { cohortYear, project } = student;
  const cohortFeedbacks = await findManyDeadlines({
    where: { cohortYear: cohortYear, type: "Feedback" },
  });

  const pFeedbackSubmissions = cohortFeedbacks.map(async (feedback) => {
    const submission = await findFirstSubmission({
      where: {
        deadlineId: feedback.id,
        fromProjectId: project.id,
        toUserId: project.adviserId,
      },
    });
    return {
      ...feedback,
      toUser: project.adviser,
      submission: submission ? submission : undefined,
    };
  });

  return await Promise.all(pFeedbackSubmissions);
}

/* Get a Student's Milestones by Student ID */
export async function getMilestonesByStudent(
  student: Student & { project: Project | null }
) {
  if (!student.project) {
    throw new SkylabError(
      "This student is not part of a project, and hence has no deadlines!",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const { cohortYear, project } = student;
  const cohortMilestones = await findManyDeadlines({
    where: { cohortYear: cohortYear, type: "Milestone" },
    orderBy: { createdOn: "asc" },
  });

  const milestoneSubmissions = cohortMilestones.map(async (deadline) => {
    const submission = await findFirstSubmission({
      where: { deadlineId: deadline.id, fromProjectId: project.id },
      rejectOnNotFound: false,
    });

    return {
      ...deadline,
      submission: submission ? submission : undefined,
    };
  });
  return await Promise.all(milestoneSubmissions);
}

export async function getEvaluationsByStudent(
  student: Student & { project: Project | null }
) {
  if (!student.project) {
    throw new SkylabError(
      "This student is not part of a project, and hence has no deadlines!",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const { cohortYear, project } = student;

  const pCohortEvaluations = await findManyEvaluations({
    where: { cohortYear: cohortYear, type: "Evaluation" },
    orderBy: { createdOn: "asc" },
  });

  const pProjectRelations = await findManyRelations({
    where: { fromProjectId: project.id },
    include: { toProject: true },
  });

  const [cohortEvaluations, projectRelations] = await Promise.all([
    pCohortEvaluations,
    pProjectRelations,
  ]);

  const evaluationSubmissions = cohortEvaluations.map(async (evaluation) => {
    const requiredEvaluationSubmissions = await Promise.all(
      projectRelations.map(async ({ toProjectId }) => {
        if (!evaluation.evaluation) {
          throw new SkylabError(
            "Evaluation missing metadata",
            HttpStatusCode.INTERNAL_SERVER_ERROR
          );
        }

        const pSubmission = findFirstSubmission({
          where: {
            deadlineId: evaluation.id,
            fromProjectId: project.id,
            toProjectId: toProjectId,
          },
        });

        const pToProject = findUniqueProject({ where: { id: toProjectId } });

        const pToProjSubmission = findFirstSubmission({
          where: {
            deadlineId: evaluation.evaluation.milestoneId,
            fromProjectId: toProjectId,
          },
        });

        const [submission, toProject, toProjSubmission] = await Promise.all([
          pSubmission,
          pToProject,
          pToProjSubmission,
        ]);

        const { evaluation: metadata, ...evaluationData } = evaluation;

        return {
          ...evaluationData,
          milestoneId: metadata.milestoneId,
          toProject: toProject,
          submission: submission ? submission : undefined,
          toProjectSubmission: toProjSubmission ? toProjSubmission : undefined,
        };
      })
    );
    return requiredEvaluationSubmissions;
  });

  return (await Promise.all(evaluationSubmissions)).flat();
}

export async function getPeerEvaluationFeedbackByStudentID(studentId: number) {
  const student = await findUniqueStudentWithProjectWithAdviserData({
    where: { id: studentId },
  });

  if (!student.project) {
    throw new SkylabError(
      "This student is not part of a project, and hence has no deadlines!",
      HttpStatusCode.BAD_REQUEST
    );
  }

  if (!student.project.adviser) {
    throw new SkylabError(
      "This student in in a project with no advisers, and hence is not required to submit feedback!",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const pCohortEvaluations = findManyEvaluations({
    where: { cohortYear: student.cohortYear, type: "Evaluation" },
  });

  const pCohortFeedbacks = findManyDeadlines({
    where: { cohortYear: student.cohortYear, type: "Feedback" },
  });

  const [cohortEvaluations, cohortFeedbacks] = await Promise.all([
    pCohortEvaluations,
    pCohortFeedbacks,
  ]);

  const pEvaluationsToProject = cohortEvaluations.map(async (evaluation) => {
    if (!evaluation.evaluation) {
      throw new SkylabError(
        "Evaluation missing metadata",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }

    const receivedEvaluations = await findManySubmissions({
      where: { deadlineId: evaluation.id, toProjectId: student.projectId },
      include: { fromProject: true, fromUser: true },
    });

    const { evaluation: metadata, ...evaluationData } = evaluation;

    return {
      deadline: {
        ...evaluationData,
        milestoneId: metadata.milestoneId,
      },
      submissions: receivedEvaluations,
    };
  });

  const pFeedbacksToProject = cohortFeedbacks.map(async (feedback) => {
    const receivedFeedbacks = await findManySubmissions({
      where: { deadlineId: feedback.id, toProjectId: student.projectId },
      include: { fromUser: true },
    });

    return {
      deadline: feedback,
      submissions: receivedFeedbacks,
    };
  });

  const peerEvaluationsFeedbacks = await Promise.all(
    [pEvaluationsToProject, pFeedbacksToProject].flat()
  );

  return peerEvaluationsFeedbacks;
}
