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
import {
  findManyRelationsWithFromToProjectData,
  findManyRelationsForEvaluations,
} from "../models/relations.db";
import {
  findFirstNonDraftSubmission,
  findManySubmissions,
} from "../models/submissions.db";
import { SENDER, GET_HTML_CONTENT_REMINDER } from "../utils/Emails";

export enum SubmissionStatusEnum {
  UNSUBMITTED = "Unsubmitted",
  SUBMITTED = "Submitted",
  SUBMITTED_LATE = "Submitted_Late",
}

export type FlattenedProject = ReturnType<typeof flattenProjectUsers>;

export type EvaluationResult = {
  relationId: string | number;
  fromProject?: FlattenedProject;
  fromUser?: User;
  toProject: FlattenedProject;
  submission?: Submission | Submission[];
  id?: number;
  updatedAt?: Date;
};

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
  const { search, cohortYear, page, limit, dropped } = query;
  const isDropped = dropped === "true" || dropped === true;

  const searchCondition = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { teamName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const projects = await findManyProjectsWithUserData({
    where: {
      cohortYear: Number(cohortYear),
      hasDropped: isDropped,
      ...searchCondition,
    },
    take: query.limit ?? undefined,
    skip: query.limit && query.page ? limit * page : undefined,
    orderBy: { id: "asc" },
  });

  const milestoneDeadlines = await findManyDeadlines({
    where: {
      cohortYear: Number(cohortYear),
      type: "Milestone",
    },
  });

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

  return await Promise.all(pSubmissions);
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

export async function sendReminderEmail(
  emails: string[],
  ccs: string[],
  subject: string,
  message: string
) {
  try {
    const { default: sgMail } = await import("@sendgrid/mail");
    sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? "sendgrid_api_key");

    const msg = {
      to: emails,
      cc: ccs,
      from: SENDER.email,
      subject: subject,
      html: GET_HTML_CONTENT_REMINDER(message),
    };

    await sgMail.sendMultiple(msg);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
export const getAllEvaluationSubmissions = async (query: any) => {
  const { search, cohortYear, page, limit, dropped, evaluatorTypeFilter } =
    query;
  const isDropped = dropped === "true" || dropped === true;

  const teamSearchCondition = search
    ? {
        OR: [
          {
            fromProject: {
              name: { contains: search, mode: "insensitive" as const },
            },
          },
          {
            fromProject: {
              teamName: { contains: search, mode: "insensitive" as const },
            },
          },
          {
            toProject: {
              name: { contains: search, mode: "insensitive" as const },
            },
          },
          {
            toProject: {
              teamName: { contains: search, mode: "insensitive" as const },
            },
          },
        ],
      }
    : {};
  const adviserSearchCondition = search
    ? {
        OR: [
          {
            adviser: {
              user: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          },
          { name: { contains: search, mode: "insensitive" as const } },
          { teamName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const evaluationDeadlines = await findManyDeadlines({
    where: { cohortYear: Number(cohortYear), type: "Evaluation" },
  });
  const deadlineIds = evaluationDeadlines.map((d) => d.id);

  let combined: any[] = [];

  // Fetch Teams if filter allows
  if (
    !evaluatorTypeFilter ||
    evaluatorTypeFilter === "All" ||
    evaluatorTypeFilter === "Team"
  ) {
    const relations = await findManyRelationsForEvaluations({
      where: {
        fromProject: { cohortYear: Number(cohortYear), hasDropped: isDropped },
        ...teamSearchCondition,
      },
    });

    const pTeamSubmissions = relations.map(async (relation) => {
      const submissions = await findManySubmissions({
        where: {
          fromProjectId: relation.fromProjectId,
          toProjectId: relation.toProjectId,
          deadlineId: { in: deadlineIds },
        },
        select: { id: true, updatedAt: true, deadlineId: true },
      });
      return {
        relationId: relation.id,
        fromProject: {
          ...relation.fromProject,
          adviser: relation.fromProject.adviser
            ? {
                ...relation.fromProject.adviser,
                ...relation.fromProject.adviser.user,
              }
            : null,
        },
        toProject: flattenProjectUsers(relation.toProject),
        submission: submissions || undefined,
      };
    });
    combined.push(...(await Promise.all(pTeamSubmissions)));
  }

  if (
    !evaluatorTypeFilter ||
    evaluatorTypeFilter === "All" ||
    evaluatorTypeFilter === "Adviser"
  ) {
    const adviserProjects = await findManyProjectsWithUserData({
      where: {
        cohortYear: Number(cohortYear),
        hasDropped: isDropped,
        adviserId: { not: null },
        ...adviserSearchCondition,
      },
    });

    const pAdviserSubmissions = adviserProjects.map(async (project) => {
      const submissions = await findManySubmissions({
        where: {
          fromUserId: project.adviser?.userId,
          toProjectId: project.id,
          deadlineId: { in: deadlineIds },
        },
        select: { id: true, updatedAt: true, deadlineId: true },
      });
      return {
        relationId: `A-${project.id}`,
        fromUser: project.adviser?.user,
        toProject: flattenProjectUsers(project),
        submission: submissions || undefined,
      };
    });
    combined.push(...(await Promise.all(pAdviserSubmissions)));
  }

  combined.sort((a, b) => {
    const isANum = typeof a.relationId === "number";
    const isBNum = typeof b.relationId === "number";
    if (isANum && isBNum)
      return (a.relationId as number) - (b.relationId as number);
    if (!isANum && !isBNum)
      return String(a.relationId).localeCompare(
        String(b.relationId),
        undefined,
        { numeric: true }
      );
    return isANum ? -1 : 1;
  });

  if (limit !== undefined && page !== undefined) {
    const startIndex = Number(limit) * Number(page);
    combined = combined.slice(startIndex, startIndex + Number(limit));
  }

  return combined;
};

export const getEvaluationSubmissionsByDeadlineId = async (query: any) => {
  const {
    submissionStatus,
    search,
    cohortYear,
    page,
    limit,
    deadlineId,
    dropped,
    evaluatorTypeFilter,
  } = query;
  const isDropped = dropped === "true" || dropped === true;

  const deadline = await findUniqueDeadline({
    where: { id: Number(deadlineId) },
  });

  let results: any[] = [];

  const includeTeams =
    (!deadline.evaluatorType ||
      deadline.evaluatorType === "Team" ||
      deadline.evaluatorType === "Both") &&
    (!evaluatorTypeFilter ||
      evaluatorTypeFilter === "All" ||
      evaluatorTypeFilter === "Team");

  if (includeTeams) {
    const teamSearchCondition = search
      ? {
          OR: [
            {
              fromProject: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              fromProject: {
                teamName: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              toProject: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
            {
              toProject: {
                teamName: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {};
    const relations = await findManyRelationsForEvaluations({
      where: {
        fromProject: { cohortYear: Number(cohortYear), hasDropped: isDropped },
        ...teamSearchCondition,
      },
    });

    const pTeamSubmissions = relations.map(async (relation) => {
      const submission = await findFirstNonDraftSubmission({
        where: {
          deadlineId: Number(deadlineId),
          fromProjectId: relation.fromProjectId,
          toProjectId: relation.toProjectId,
        },
      });
      return {
        relationId: relation.id,
        fromProject: {
          ...relation.fromProject,
          adviser: relation.fromProject.adviser
            ? {
                ...relation.fromProject.adviser,
                ...relation.fromProject.adviser.user,
              }
            : null,
        },
        toProject: flattenProjectUsers(relation.toProject),
        submission: submission || undefined,
      };
    });
    results.push(...(await Promise.all(pTeamSubmissions)));
  }

  const includeAdvisers =
    (deadline.evaluatorType === "Adviser" ||
      deadline.evaluatorType === "Both") &&
    (!evaluatorTypeFilter ||
      evaluatorTypeFilter === "All" ||
      evaluatorTypeFilter === "Adviser");

  if (includeAdvisers) {
    const adviserSearchCondition = search
      ? {
          OR: [
            {
              adviser: {
                user: {
                  name: { contains: search, mode: "insensitive" as const },
                },
              },
            },
            { name: { contains: search, mode: "insensitive" as const } },
            { teamName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};
    const adviserProjects = await findManyProjectsWithUserData({
      where: {
        cohortYear: Number(cohortYear),
        hasDropped: isDropped,
        adviserId: { not: null },
        ...adviserSearchCondition,
      },
    });

    const pAdviserSubmissions = adviserProjects.map(async (project) => {
      const adviser = project.adviser;

      if (!adviser) {
        return null;
      }

      const submission = await findFirstNonDraftSubmission({
        where: {
          deadlineId: Number(deadlineId),
          fromUserId: adviser.userId,
          toProjectId: project.id,
        },
      });
      return {
        relationId: `A-${project.id}`,
        fromUser: adviser.user,
        toProject: flattenProjectUsers(project),
        submission: submission || undefined,
      };
    });
    results.push(...(await Promise.all(pAdviserSubmissions)));
  }

  if (submissionStatus) {
    results = results.filter((result) => {
      const sub = result.submission;
      if (submissionStatus == SubmissionStatusEnum.UNSUBMITTED) return !sub;
      if (submissionStatus == SubmissionStatusEnum.SUBMITTED_LATE)
        return sub && deadline.dueBy && sub.updatedAt > deadline.dueBy;
      if (submissionStatus == SubmissionStatusEnum.SUBMITTED) return !!sub;
      return true;
    });
  }

  results.sort((a, b) => {
    const isANum = typeof a.relationId === "number";
    const isBNum = typeof b.relationId === "number";
    if (isANum && isBNum)
      return (a.relationId as number) - (b.relationId as number);
    if (!isANum && !isBNum)
      return String(a.relationId).localeCompare(
        String(b.relationId),
        undefined,
        { numeric: true }
      );
    return isANum ? -1 : 1;
  });

  if (limit !== undefined && page !== undefined) {
    const startIndex = Number(limit) * Number(page);
    results = results.slice(startIndex, startIndex + Number(limit));
  }

  return results.map((result) => ({
    id: result.submission?.id,
    updatedAt: result.submission?.updatedAt,
    ...result,
  }));
};
