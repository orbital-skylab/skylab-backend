/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Adviser,
  Mentor,
  Project,
  Student,
  Submission,
  User,
} from "@prisma/client";
import { findUniqueDeadline } from "src/models/deadline.db";
import { findManyProjectsWithUserData } from "src/models/projects.db";
import { findManyRelationsWithFromToProjectData } from "src/models/relations.db";
import { findFirstNonDraftSubmission } from "src/models/submissions.db";

enum SubmissionStatusEnum {
  UNSUBMITTED = "Unsubmitted",
  SUBMITTED = "Submitted",
  SUBMITTED_LATE = "Submitted_Late",
}

export function flattenProjectUsers(
  project: Project & {
    students: (Student & {
      user: User;
    })[];
    mentor:
      | (Mentor & {
          user: User;
        })
      | null;
    adviser:
      | (Adviser & {
          user: User;
        })
      | null;
  }
) {
  const { students, adviser, mentor, ...projectData } = project;
  const flattenedStudents = students.map((student) => {
    const { user, ...studentData } = student;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, password, ...userData } = user;
    return {
      ...userData,
      ...studentData,
    };
  });

  let tempMentorAdviser;

  if (adviser) {
    const { user: adviserUser, ...adviserData } = adviser;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, password, ...adviserUserData } = adviserUser;
    tempMentorAdviser = {
      adviser: {
        ...adviserData,
        ...adviserUserData,
      },
    };
  } else {
    tempMentorAdviser = {
      adviser: null,
    };
  }

  if (mentor) {
    const { user: mentorUser, ...mentorData } = mentor;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, password, ...mentorUserData } = mentorUser;
    tempMentorAdviser = {
      ...tempMentorAdviser,
      mentor: {
        ...mentorUserData,
        ...mentorData,
      },
    };
  } else {
    tempMentorAdviser = {
      ...tempMentorAdviser,
      mentor: null,
    };
  }

  return {
    ...tempMentorAdviser,
    ...projectData,
    students: flattenedStudents,
  };
}

export async function getSubmissionsByDeadlineId(
  query: any & {
    cohortYear: number;
    deadlineId: number;
    submissionStatus?: SubmissionStatusEnum;
    search?: string;
    page?: number;
    limit?: number;
  }
) {
  const { submissionStatus, search } = query;
  const cohortYear = Number(query.cohortYear);
  const page = Number(query.page);
  const limit = Number(query.limit);
  const deadlineId = Number(query.deadlineId);

  const deadline = await findUniqueDeadline({ where: { id: deadlineId } });
  const projects = await findManyProjectsWithUserData({
    where: {
      cohortYear: cohortYear,
      name: search ? { contains: search } : undefined,
    },
    take: query.limit ?? undefined,
    skip: query.limit && query.page ? limit * page : undefined,
  });
  const projectIds = projects.map(({ id }) => id);

  let results: {
    fromProject: Project;
    toUser?: User;
    toProject?: Project;
    submission?: Submission;
  }[];
  if (deadline.type == "Evaluation") {
    const relations = await findManyRelationsWithFromToProjectData({
      where: { fromProjectId: { in: projectIds } },
    });
    const pSubmissions = relations.map(async (relation) => {
      const submission = await findFirstNonDraftSubmission({
        where: {
          deadlineId: deadlineId,
          fromProjectId: relation.fromProjectId,
          toProjectId: relation.toProjectId,
        },
      });
      return {
        fromProject: relation.fromProject,
        toProject: relation.toProject,
        submissionId: submission ? submission.id : undefined,
      };
    });
    results = await Promise.all(pSubmissions);
  } else if (deadline.type == "Feedback") {
    const pSubmissions = projects.map(async (project) => {
      const submission = await findFirstNonDraftSubmission({
        where: {
          deadlineId: deadlineId,
          fromProjectId: project.id,
          toUserId: project.adviserId,
        },
      });
      return {
        fromProject: flattenProjectUsers(project),
        toUser: project.adviser?.user,
        submission: submission ? submission : undefined,
      };
    });
    results = await Promise.all(pSubmissions);
  } else {
    const pSubmissions = projects.map(async (project) => {
      const submission = await findFirstNonDraftSubmission({
        where: {
          deadlineId: deadlineId,
          fromProjectId: project.id,
        },
      });
      return {
        fromProject: flattenProjectUsers(project),
        submissionId: submission ? submission.id : undefined,
      };
    });
    results = await Promise.all(pSubmissions);
  }

  if (!submissionStatus) {
    return results;
  } else {
    const filteredResult = results.filter((result) => {
      const typeOfSubmission = typeof result.submission;
      if (submissionStatus == SubmissionStatusEnum.UNSUBMITTED) {
        return typeOfSubmission == undefined;
      } else if (submissionStatus == SubmissionStatusEnum.SUBMITTED_LATE) {
        return (
          result.submission && result.submission.updatedAt > deadline.dueBy
        );
      } else if (submissionStatus == SubmissionStatusEnum.SUBMITTED) {
        return result.submission;
      }
    });
    return filteredResult;
  }
}
