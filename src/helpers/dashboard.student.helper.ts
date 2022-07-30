import { Adviser, Deadline, Project, Student } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import { findManyDeadlines, findManyEvaluations } from "src/models/deadline.db";
import { findUniqueProject } from "src/models/projects.db";
import {
  findManyRelations,
  findManyRelationsWithFromProjectData,
} from "src/models/relations.db";
import { findUniqueStudentWithProjectWithAdviserData } from "src/models/students.db";
import { findFirstSubmission } from "src/models/submissions.db";
import { findUniqueUser } from "src/models/users.db";
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

  const pFeedbackSubmissions = cohortFeedbacks.map(
    async (feedback: Deadline) => {
      const submission = await findFirstSubmission({
        where: {
          deadlineId: feedback.id,
          fromProjectId: project.id,
          toUserId: project.adviserId,
        },
      });
      return {
        deadline: feedback,
        toUser: project.adviser,
        submission: submission ? submission : undefined,
      };
    }
  );

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

  const milestoneSubmissions = cohortMilestones.map(
    async (deadline: Deadline) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const submission = await findFirstSubmission({
        where: { deadlineId: deadline.id, fromProjectId: project.id },
        rejectOnNotFound: false,
      });

      return {
        deadline: deadline,
        submission: submission ? submission : undefined,
      };
    }
  );
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
        if (!evaluation.evaluatingMilestoneId) {
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
            deadlineId: evaluation.evaluatingMilestoneId,
            fromProjectId: toProjectId,
          },
        });

        const [submission, toProject, toProjSubmission] = await Promise.all([
          pSubmission,
          pToProject,
          pToProjSubmission,
        ]);

        return {
          deadline: evaluation,
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

  if (!student.projectId || !student.project) {
    throw new SkylabError(
      "This student is not part of a project, and hence has no deadlines!",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const { project, projectId, cohortYear } = student;

  if (!project.adviser) {
    throw new SkylabError(
      "This student in in a project with no advisers, and hence is not required to submit feedback!",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const { adviser } = project;

  const pAdviserUser = findUniqueUser({ where: { id: adviser.userId } });

  const pCohortEvaluations = findManyEvaluations({
    where: { cohortYear: cohortYear, type: "Evaluation" },
  });

  const pCohortFeedbacks = findManyDeadlines({
    where: { cohortYear: cohortYear, type: "Feedback" },
  });

  const [adviserUser, cohortEvaluations, cohortFeedbacks] = await Promise.all([
    pAdviserUser,
    pCohortEvaluations,
    pCohortFeedbacks,
  ]);

  const relations = await findManyRelationsWithFromProjectData({
    where: {
      toProjectId: projectId,
    },
  });

  const pProjectSubmissions = [...cohortEvaluations, ...cohortFeedbacks].map(
    async (deadline) => {
      const pPeerSubmissions = relations.map(async (relation) => {
        const submission = await findFirstSubmission({
          where: {
            deadlineId: deadline.id,
            fromProjectId: relation.fromProjectId,
            toProjectId: projectId,
          },
        });
        return {
          ...submission,
          fromProject: relation.fromProject,
        };
      });

      const peerSubmissions = await Promise.all(pPeerSubmissions);

      if (deadline.type !== "Evaluation") {
        return {
          deadline: deadline,
          submissions: peerSubmissions,
        };
      }

      const pAdviserSubmission = findFirstSubmission({
        where: {
          deadlineId: deadline.id,
          fromUserId: adviserUser.id,
          toProjectId: projectId,
        },
      });

      const adviserSubmission = await pAdviserSubmission;

      return {
        deadline: deadline,
        submissions: [
          ...peerSubmissions,
          { fromUser: adviserUser, ...adviserSubmission },
        ],
      };
    }
  );

  return await Promise.all(pProjectSubmissions);
}
