/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Adviser,
  Mentor,
  Project,
  Student,
  Submission,
  User,
} from "@prisma/client";
import { findUniqueDeadline, findManyDeadlines } from "../models/deadline.db";
import { findManyProjectsWithUserData } from "../models/projects.db";
import { findManyRelationsWithFromToProjectData } from "../models/relations.db";
import {
  findFirstNonDraftSubmission,
  findManySubmissions,
} from "../models/submissions.db";

export enum SubmissionStatusEnum {
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

export const getSubmissions = async (
  query: any & {
    cohortYear: number;
    deadlineId?: number;
    submissionStatus?: SubmissionStatusEnum;
    search?: string;
    page?: number;
    limit?: number;
    dropped: boolean;
  }
) => {
  const { deadlineId } = query;
  if (deadlineId) {
    return await getSubmissionsByDeadlineId(query);
  }

  return await getAllSubmissions(query);
};

export const getAllSubmissions = async (
  query: any & {
    cohortYear: number;
    search?: string;
    page?: number;
    limit?: number;
    dropped: boolean;
  }
) => {
  console.log("HELLO");
  const { search, cohortYear, page, limit, dropped } = query;
  const projects = await findManyProjectsWithUserData({
    where: {
      cohortYear: cohortYear,
      name: search ? { contains: search } : undefined,
    },
    take: query.limit ?? undefined,
    skip: query.limit && query.page ? limit * page : undefined,
  });

  console.log(projects);

  const milestoneDeadlines = await findManyDeadlines({
    where: {
      type: "Milestone",
    },
  });

  console.log(milestoneDeadlines);

  let results: {
    fromProject: Project;
    toUser?: User;
    toProject?: Project;
    submission?: Submission[];
  }[];

  const pSubmissions = projects.map(async (project) => {
    const submission = await findManySubmissions({
      where: {
        fromProjectId: project.id,
        deadlineId: {
          in: milestoneDeadlines.map(
            (milestoneDeadline) => milestoneDeadline.id
          ),
        },
      },
      select: {
        id: true,
        updatedAt: true,
        deadlineId: true,
      },
    });

    return {
      fromProject: flattenProjectUsers(project),
      submission: submission || undefined,
    };
  });

  results = await Promise.all(pSubmissions);

  results = results.filter((result) => {
    if (dropped == "true") {
      return !!result.fromProject.hasDropped;
    } else {
      return !result.fromProject.hasDropped;
    }
  });

  return results;
};

export const getSubmissionsByDeadlineId = async (
  query: any & {
    cohortYear: number;
    deadlineId: number;
    submissionStatus?: SubmissionStatusEnum;
    search?: string;
    page?: number;
    limit?: number;
    dropped: boolean;
  }
) => {
  const {
    submissionStatus,
    search,
    cohortYear,
    page,
    limit,
    deadlineId,
    dropped,
  } = query;

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
        submission: submission || undefined,
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
        submission: submission || undefined,
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
        submission: submission || undefined,
      };
    });
    results = await Promise.all(pSubmissions);
  }

  results = results.filter((result) => {
    if (dropped == "true") {
      return !!result.fromProject.hasDropped;
    } else {
      return !result.fromProject.hasDropped;
    }
  });

  if (!submissionStatus) {
    return results.map((result) => {
      const { submission, ...resultData } = result;
      return {
        id: submission ? submission.id : undefined,
        updatedAt: submission ? submission.updatedAt : undefined,
        ...resultData,
      };
    });
  } else {
    const filteredResult = results.filter((result) => {
      if (submissionStatus == SubmissionStatusEnum.UNSUBMITTED) {
        return !result.submission;
      } else if (submissionStatus == SubmissionStatusEnum.SUBMITTED_LATE) {
        return (
          result.submission && result.submission.updatedAt > deadline.dueBy
        );
      } else if (submissionStatus == SubmissionStatusEnum.SUBMITTED) {
        return !!result.submission;
      }
    });

    return filteredResult.map((result) => {
      const { submission, ...resultData } = result;
      return {
        id: submission ? submission.id : undefined,
        updatedAt: submission ? submission.updatedAt : undefined,
        ...resultData,
      };
    });
  }
};
