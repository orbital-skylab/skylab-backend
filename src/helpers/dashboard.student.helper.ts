import { DeadlineType } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import { findManyDeadlines, findManyEvaluations } from "src/models/deadline.db";
import { findManyRelationsWithFromProjectData } from "src/models/relations.db";
import {
  findUniqueStudentWithProjectWithAdviserData,
  findUniqueStudentWithProjectWithAdviserUserData,
} from "src/models/students.db";
import {
  findFirstSubmission,
  findFirstNonDraftSubmission,
} from "src/models/submissions.db";
import { findUniqueUser } from "src/models/users.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

export async function getDeadlinesByStudentId(studentId: number) {
  const student = await findUniqueStudentWithProjectWithAdviserUserData({
    where: { id: studentId },
  });

  if (!student.project) {
    throw new SkylabError(
      "This student is not part of a project, and hence has no deadlines!",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const { cohortYear, project } = student;

  if (!project.adviser) {
    throw new SkylabError(
      "This student in in a project with no advisers, and hence is not required to submit feedback!",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const { adviser } = project;

  const deadlines = await findManyDeadlines({
    where: {
      cohortYear: cohortYear,
      type: {
        in: [
          DeadlineType.Evaluation,
          DeadlineType.Milestone,
          DeadlineType.Feedback,
        ],
      },
    },
    orderBy: { dueBy: "asc" },
  });

  const relations = await findManyRelationsWithFromProjectData({
    where: { fromProjectId: project.id },
  });

  const pDeadlinesOfStudent = deadlines.map(async (deadline) => {
    const deadlineAttribute = { deadline: deadline };
    if (deadline.type == "Milestone") {
      const submission = await findFirstSubmission({
        where: { deadlineId: deadline.id, fromProjectId: project.id },
        rejectOnNotFound: false,
      });
      return {
        ...deadlineAttribute,
        submission: submission ? submission : undefined,
      };
    } else if (deadline.type == "Evaluation") {
      const pEvaluationDeadlines = relations.map(async (relation) => {
        const submission = await findFirstSubmission({
          where: {
            id: deadline.id,
            fromProjectId: project.id,
            toProjectId: relation.toProjectId,
          },
        });
        return {
          ...deadlineAttribute,
          submission: submission ? submission : undefined,
          fromProject: relation.fromProject,
        };
      });
      return await Promise.all(pEvaluationDeadlines);
    } else {
      const submission = await findFirstSubmission({
        where: {
          deadlineId: deadline.id,
          fromProjectId: project.id,
          toUserId: adviser.userId,
        },
      });
      return {
        ...deadlineAttribute,
        submission: submission ? submission : undefined,
        toUser: adviser.user,
      };
    }
  });

  const deadlinesOfStudent = (await Promise.all(pDeadlinesOfStudent)).flat();

  return deadlinesOfStudent;
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
        const submission = await findFirstNonDraftSubmission({
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

      const pAdviserSubmission = findFirstNonDraftSubmission({
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
