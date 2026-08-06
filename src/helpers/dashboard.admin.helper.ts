/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Adviser,
  DeadlineType,
  EvaluatorType,
  Mentor,
  Project,
  Student,
  Submission,
  User,
} from "@prisma/client";
import {
  findUniqueDeadline,
  findManyDeadlines,
  findManyDeadlinesWithQuestionsData,
  findUniqueDeadlineWithQuestionsData,
} from "../models/deadline.db";
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
import { prisma } from "../client";
import { removePasswordFromUser } from "./users.helper";

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

export type CollatedMilestoneQuestionResponse = {
  questionId: number;
  sectionId: number;
  sectionName: string;
  sectionNumber: number;
  questionNumber: number;
  question: string;
  description: string;
  isAnonymous: boolean;
  isRequired: boolean;
  type: string;
  urlType?: string | null;
  responses: {
    projectId: number;
    teamName: string;
    projectName: string;
    submissionId?: number;
    submittedAt?: Date;
    answer?: string;
  }[];
};

export type CollatedMilestoneDeadlineResponse = {
  deadline: any;
  questions: CollatedMilestoneQuestionResponse[];
};

export type CollatedEvaluationQuestionResponse = {
  questionId: number;
  sectionId: number;
  sectionName: string;
  sectionNumber: number;
  questionNumber: number;
  question: string;
  description: string;
  isAnonymous: boolean;
  isRequired: boolean;
  type: string;
  urlType?: string | null;
  responses: {
    responseId: string;
    evaluateeProjectId: number;
    evaluatorType: "Team" | "Adviser";
    evaluatorName: string;
    evaluateeName: string;
    submissionId?: number;
    submittedAt?: Date;
    answer?: string;
  }[];
};

export type CollatedEvaluationDeadlineResponse = {
  deadline: any;
  questions: CollatedEvaluationQuestionResponse[];
};

const withoutPassword = (user?: User | null) => {
  if (!user) return {};

  return removePasswordFromUser(user);
};

const includesTeamEvaluator = (evaluatorType: EvaluatorType | null) =>
  !evaluatorType ||
  evaluatorType === EvaluatorType.Team ||
  evaluatorType === EvaluatorType.Both;

const includesAdviserEvaluator = (evaluatorType: EvaluatorType | null) =>
  !evaluatorType ||
  evaluatorType === EvaluatorType.Adviser ||
  evaluatorType === EvaluatorType.Both;

const flattenStudentUser = (student: Student & { user?: User | null }) => {
  const { user, id: studentId, ...studentData } = student;
  return {
    studentId,
    ...withoutPassword(user),
    ...studentData,
  };
};

const flattenAdviserUser = (adviser: Adviser & { user?: User | null }) => {
  const { user, id: adviserId, ...adviserData } = adviser;
  return {
    adviserId,
    ...withoutPassword(user),
    ...adviserData,
  };
};

const flattenMentorUser = (mentor: Mentor & { user?: User | null }) => {
  const { user, id: mentorId, ...mentorData } = mentor;
  return {
    mentorId,
    ...withoutPassword(user),
    ...mentorData,
  };
};

export function flattenProjectUsers(
  project: Project & {
    students?: (Student & {
      user: User;
    })[];
    mentor?:
      | (Mentor & {
          user: User;
        })
      | null;
    adviser?:
      | (Adviser & {
          user: User;
        })
      | null;
  }
) {
  const { students, adviser, mentor, ...projectData } = project;

  const flattenedStudents = students
    ? students.map((student) => flattenStudentUser(student))
    : [];

  let tempMentorAdviser;

  if (adviser) {
    tempMentorAdviser = {
      adviser: flattenAdviserUser(adviser),
    };
  } else {
    tempMentorAdviser = {
      adviser: null,
    };
  }

  if (mentor) {
    tempMentorAdviser = {
      ...tempMentorAdviser,
      mentor: flattenMentorUser(mentor),
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
    deadlineType?: DeadlineType;
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

export const getFeedbackSubmissions = async (
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
  const feedbackQuery = {
    ...query,
    deadlineType: DeadlineType.Feedback,
  };

  return query.deadlineId
    ? await getEvaluationSubmissionsByDeadlineId(feedbackQuery)
    : await getAllEvaluationSubmissions(feedbackQuery);
};

export const getCollatedMilestoneSubmissions = async (
  query: any & {
    cohortYear: number;
    deadlineId?: number;
    submissionStatus?: SubmissionStatusEnum;
    search?: string;
    includeAnonymous?: boolean;
    dropped: boolean;
  }
): Promise<{
  collated: CollatedMilestoneDeadlineResponse[];
  evaluationCollated: CollatedEvaluationDeadlineResponse[];
}> => {
  const { cohortYear, deadlineId, dropped, search, submissionStatus } = query;
  const isDropped = dropped === "true" || dropped === true;
  const shouldIncludeAnonymous =
    query.includeAnonymous === "true" || query.includeAnonymous === true;

  const deadlines = deadlineId
    ? [
        await findUniqueDeadlineWithQuestionsData({
          where: { id: Number(deadlineId) },
        }),
      ]
    : await findManyDeadlinesWithQuestionsData({
        where: {
          cohortYear: Number(cohortYear),
          type: "Milestone",
        },
        orderBy: { id: "asc" },
      });

  const milestoneDeadlines = deadlines.filter(
    (deadline) => deadline.type === "Milestone"
  );

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
    orderBy: { id: "asc" },
  });

  if (!projects.length) {
    return {
      collated: milestoneDeadlines.map((deadlineWithSections) => {
        const deadline = { ...deadlineWithSections };
        delete (deadline as { sections?: unknown }).sections;

        return {
          deadline,
          questions: [],
        };
      }),
      evaluationCollated: [],
    };
  }

  const submissions = await prisma.submission.findMany({
    where: {
      deadlineId: {
        in: milestoneDeadlines.map((deadline) => deadline.id),
      },
      fromProjectId: {
        in: projects.map((project) => project.id),
      },
      isDraft: false,
    },
    include: {
      answers: true,
    },
  });

  const submissionsMap = new Map(
    submissions.map((submission) => [
      `${submission.deadlineId}-${submission.fromProjectId}`,
      submission,
    ])
  );

  const collated = milestoneDeadlines.map(({ sections, ...deadline }) => ({
    deadline,
    questions: sections.flatMap((section) =>
      section.questions
        .filter((question) =>
          shouldIncludeAnonymous ? question.isAnonymous : !question.isAnonymous
        )
        .map((question) => ({
          questionId: question.id,
          sectionId: section.id,
          sectionName: section.name,
          sectionNumber: section.sectionNumber,
          questionNumber: question.questionNumber,
          question: question.question,
          description: question.desc,
          isAnonymous: question.isAnonymous,
          isRequired: question.isRequired,
          type: question.type,
          urlType: question.urlType,
          responses: projects
            .map((project) => {
              const submission = submissionsMap.get(
                `${deadline.id}-${project.id}`
              );
              const answer = submission?.answers.find(
                ({ questionId }) => questionId === question.id
              );

              return {
                projectId: project.id,
                teamName: project.teamName,
                projectName: project.name,
                submissionId: submission?.id,
                submittedAt: submission?.updatedAt,
                answer: answer?.answer ?? "",
              };
            })
            .filter((response) => {
              if (!submissionStatus) {
                return true;
              }

              if (submissionStatus === SubmissionStatusEnum.UNSUBMITTED) {
                return !response.submissionId;
              }

              if (submissionStatus === SubmissionStatusEnum.SUBMITTED) {
                return (
                  !!response.submissionId &&
                  !!response.submittedAt &&
                  response.submittedAt <= deadline.dueBy
                );
              }

              if (submissionStatus === SubmissionStatusEnum.SUBMITTED_LATE) {
                return (
                  !!response.submissionId &&
                  !!response.submittedAt &&
                  response.submittedAt > deadline.dueBy
                );
              }

              return true;
            }),
        }))
    ),
  }));

  if (!deadlineId) {
    return { collated, evaluationCollated: [] };
  }

  const evaluationDeadlines = await findManyDeadlinesWithQuestionsData({
    where: {
      cohortYear: Number(cohortYear),
      type: "Evaluation",
      evaluatingMilestoneId: Number(deadlineId),
    },
    orderBy: { id: "asc" },
  });

  if (!evaluationDeadlines.length) {
    return { collated, evaluationCollated: [] };
  }

  const evaluationDeadlineIds = evaluationDeadlines.map(
    (deadline) => deadline.id
  );
  const evaluationSubmissions = await prisma.submission.findMany({
    where: {
      deadlineId: { in: evaluationDeadlineIds },
      isDraft: false,
    },
    include: {
      answers: true,
    },
  });

  const evaluationSubmissionsMap = new Map(
    evaluationSubmissions.map((submission) => {
      const submissionKey = submission.fromProjectId
        ? `team-${submission.deadlineId}-${submission.fromProjectId}-${submission.toProjectId}`
        : `adviser-${submission.deadlineId}-${submission.fromUserId}-${submission.toProjectId}`;
      return [submissionKey, submission];
    })
  );

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

  const teamRelations = await findManyRelationsForEvaluations({
    where: {
      fromProject: { cohortYear: Number(cohortYear), hasDropped: isDropped },
      ...teamSearchCondition,
    },
  });

  const adviserProjects = await findManyProjectsWithUserData({
    where: {
      cohortYear: Number(cohortYear),
      hasDropped: isDropped,
      adviserId: { not: null },
      ...adviserSearchCondition,
    },
    orderBy: { id: "asc" },
  });

  const evaluationCollated = evaluationDeadlines.map(
    ({ sections, ...deadline }) => {
      const responseRows: {
        responseId: string;
        evaluateeProjectId: number;
        evaluatorType: "Team" | "Adviser";
        evaluatorName: string;
        evaluateeName: string;
        submissionId?: number;
        submittedAt?: Date;
        answers: { questionId: number; answer: string }[];
      }[] = [];

      if (includesTeamEvaluator(deadline.evaluatorType)) {
        teamRelations.forEach((relation) => {
          const submission = evaluationSubmissionsMap.get(
            `team-${deadline.id}-${relation.fromProjectId}-${relation.toProjectId}`
          );
          responseRows.push({
            responseId: `team-${relation.id}`,
            evaluateeProjectId: relation.toProjectId,
            evaluatorType: "Team",
            evaluatorName:
              relation.fromProject.teamName || relation.fromProject.name,
            evaluateeName:
              relation.toProject.teamName || relation.toProject.name,
            submissionId: submission?.id,
            submittedAt: submission?.updatedAt,
            answers: submission?.answers ?? [],
          });
        });
      }

      if (includesAdviserEvaluator(deadline.evaluatorType)) {
        adviserProjects.forEach((project) => {
          if (!project.adviser?.userId) return;
          const submission = evaluationSubmissionsMap.get(
            `adviser-${deadline.id}-${project.adviser.userId}-${project.id}`
          );
          responseRows.push({
            responseId: `adviser-${project.id}`,
            evaluateeProjectId: project.id,
            evaluatorType: "Adviser",
            evaluatorName: project.adviser.user.name,
            evaluateeName: project.teamName || project.name,
            submissionId: submission?.id,
            submittedAt: submission?.updatedAt,
            answers: submission?.answers ?? [],
          });
        });
      }

      const filteredRows = responseRows.filter((response) => {
        if (!submissionStatus) return true;
        if (submissionStatus === SubmissionStatusEnum.UNSUBMITTED) {
          return !response.submissionId;
        }
        if (submissionStatus === SubmissionStatusEnum.SUBMITTED) {
          return (
            !!response.submissionId &&
            !!response.submittedAt &&
            response.submittedAt <= deadline.dueBy
          );
        }
        if (submissionStatus === SubmissionStatusEnum.SUBMITTED_LATE) {
          return (
            !!response.submissionId &&
            !!response.submittedAt &&
            response.submittedAt > deadline.dueBy
          );
        }
        return true;
      });

      return {
        deadline,
        questions: sections.flatMap((section) =>
          section.questions.map((question) => ({
            questionId: question.id,
            sectionId: section.id,
            sectionName: section.name,
            sectionNumber: section.sectionNumber,
            questionNumber: question.questionNumber,
            question: question.question,
            description: question.desc,
            isAnonymous: question.isAnonymous,
            isRequired: question.isRequired,
            type: question.type,
            urlType: question.urlType,
            responses: filteredRows.map((response) => ({
              responseId: response.responseId,
              evaluateeProjectId: response.evaluateeProjectId,
              evaluatorType: response.evaluatorType,
              evaluatorName: response.evaluatorName,
              evaluateeName: response.evaluateeName,
              submissionId: response.submissionId,
              submittedAt: response.submittedAt,
              answer:
                response.answers.find(
                  ({ questionId }) => questionId === question.id
                )?.answer ?? "",
            })),
          }))
        ),
      };
    }
  );

  return { collated, evaluationCollated };
};

export const getAllSubmissions = async (
  query: any & {
    cohortYear: number;
    deadlineType?: DeadlineType;
    search?: string;
    page?: number;
    limit?: number;
    dropped: boolean;
  }
) => {
  const { search, cohortYear, page, limit, dropped } = query;
  const deadlineType = query.deadlineType ?? DeadlineType.Milestone;
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
  });

  const deadlines = await findManyDeadlines({
    where: {
      cohortYear: Number(cohortYear),
      type: deadlineType,
    },
  });

  const pSubmissions = projects.map(async (project) => {
    const submissions = await findManySubmissions({
      where: {
        fromProjectId: project.id,
        isDraft: false,
        deadlineId: {
          in: deadlines.map((deadline) => deadline.id),
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
      submission: submissions.length > 0 ? submissions : undefined,
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

  const isDropped = dropped === "true" || dropped === true;
  const deadline = await findUniqueDeadline({ where: { id: deadlineId } });
  const projects = await findManyProjectsWithUserData({
    where: {
      cohortYear: cohortYear,
      hasDropped: isDropped,
      name: search ? { contains: search } : undefined,
    },
  });
  const projectIds = projects.map(({ id }) => id);

  let results: {
    fromProject: Project;
    toUser?: Omit<User, "password">;
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
      if (!project.adviser) return null;

      const submission = await findFirstNonDraftSubmission({
        where: {
          deadlineId: deadlineId,
          fromProjectId: project.id,
          toUserId: project.adviser.userId,
        },
      });
      return {
        fromProject: flattenProjectUsers(project),
        toUser: removePasswordFromUser(project.adviser.user),
        submission: submission || undefined,
      };
    });
    results = (await Promise.all(pSubmissions)).filter(
      (result): result is NonNullable<typeof result> => result !== null
    );
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

  if (submissionStatus) {
    results = results.filter((result) => {
      if (submissionStatus == SubmissionStatusEnum.UNSUBMITTED) {
        return !result.submission;
      } else if (submissionStatus == SubmissionStatusEnum.SUBMITTED_LATE) {
        return (
          result.submission && result.submission.updatedAt > deadline.dueBy
        );
      } else if (submissionStatus == SubmissionStatusEnum.SUBMITTED) {
        return (
          !!result.submission && result.submission.updatedAt <= deadline.dueBy
        );
      }
    });
  }

  results.sort((a, b) => a.fromProject.id - b.fromProject.id);

  if (limit !== undefined) {
    const startIndex = Number(limit) * Number(page ?? 0);
    results = results.slice(startIndex, startIndex + Number(limit));
  }

  return results.map((result) => {
    const { submission, ...resultData } = result;
    return {
      id: submission ? submission.id : undefined,
      updatedAt: submission ? submission.updatedAt : undefined,
      ...resultData,
    };
  });
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
  const deadlineType = query.deadlineType ?? DeadlineType.Evaluation;
  const isFeedback = deadlineType === DeadlineType.Feedback;
  const includeAnswers =
    query.includeAnswers === "true" || query.includeAnswers === true;

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
    where: { cohortYear: Number(cohortYear), type: deadlineType },
  });
  const deadlineIds = evaluationDeadlines.map((d) => d.id);
  const hasTeamDeadline = evaluationDeadlines.some((deadline) =>
    includesTeamEvaluator(deadline.evaluatorType)
  );
  const hasAdviserDeadline = evaluationDeadlines.some((deadline) =>
    includesAdviserEvaluator(deadline.evaluatorType)
  );

  let combined: any[] = [];

  // Fetch Teams if filter allows
  if (
    hasTeamDeadline &&
    (!evaluatorTypeFilter ||
      evaluatorTypeFilter === "All" ||
      evaluatorTypeFilter === "Team")
  ) {
    const relations = await findManyRelationsForEvaluations({
      where: {
        ...(isFeedback
          ? {
              toProject: {
                cohortYear: Number(cohortYear),
                hasDropped: isDropped,
              },
            }
          : {
              fromProject: {
                cohortYear: Number(cohortYear),
                hasDropped: isDropped,
              },
            }),
        ...teamSearchCondition,
      },
    });

    const evaluatorProjectIds = Array.from(
      new Set(
        relations.map((relation) =>
          isFeedback ? relation.toProjectId : relation.fromProjectId
        )
      )
    );
    const evaluatorProjects = await findManyProjectsWithUserData({
      where: { id: { in: evaluatorProjectIds } },
    });
    const projectsWithStudentsMap = new Map(
      evaluatorProjects.map((p) => [p.id, p.students])
    );

    const pTeamSubmissions = relations.map(async (relation) => {
      const evaluatorProject = isFeedback
        ? relation.toProject
        : relation.fromProject;
      const evaluateeProject = isFeedback
        ? relation.fromProject
        : relation.toProject;
      const submissions = await findManySubmissions({
        where: {
          fromProjectId: evaluatorProject.id,
          toProjectId: evaluateeProject.id,
          isDraft: false,
          deadlineId: { in: deadlineIds },
        },
        ...(includeAnswers
          ? { include: { answers: { include: { question: true } } } }
          : { select: { id: true, updatedAt: true, deadlineId: true } }),
      });

      const rawStudents =
        projectsWithStudentsMap.get(evaluatorProject.id) || [];
      const flattenedStudents = rawStudents.map((student) =>
        flattenStudentUser(student)
      );

      return {
        relationId: isFeedback ? `F-T-${relation.id}` : relation.id,
        fromProject: {
          ...evaluatorProject,
          adviser: evaluatorProject.adviser
            ? flattenAdviserUser(evaluatorProject.adviser)
            : null,
          students: flattenedStudents,
        },
        toProject: flattenProjectUsers(evaluateeProject),
        submission: submissions.length > 0 ? submissions : undefined,
      };
    });
    combined.push(...(await Promise.all(pTeamSubmissions)));

    if (isFeedback) {
      const teamAdviserProjects = await findManyProjectsWithUserData({
        where: {
          cohortYear: Number(cohortYear),
          hasDropped: isDropped,
          adviserId: { not: null },
          ...adviserSearchCondition,
        },
      });
      const teamAdviserSubmissions = teamAdviserProjects.map(
        async (project) => {
          if (!project.adviser) return null;
          const submissions = await findManySubmissions({
            where: {
              fromProjectId: project.id,
              toUserId: project.adviser.userId,
              isDraft: false,
              deadlineId: { in: deadlineIds },
            },
            ...(includeAnswers
              ? { include: { answers: { include: { question: true } } } }
              : { select: { id: true, updatedAt: true, deadlineId: true } }),
          });
          return {
            relationId: `F-A-${project.id}`,
            fromProject: flattenProjectUsers(project),
            fromUser: undefined,
            toUser: withoutPassword(project.adviser.user),
            submission: submissions.length > 0 ? submissions : undefined,
          };
        }
      );
      combined.push(
        ...(await Promise.all(teamAdviserSubmissions)).filter(Boolean)
      );
    }
  }

  if (
    hasAdviserDeadline &&
    (!evaluatorTypeFilter ||
      evaluatorTypeFilter === "All" ||
      evaluatorTypeFilter === "Adviser")
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
          isDraft: false,
          deadlineId: { in: deadlineIds },
        },
        ...(includeAnswers
          ? { include: { answers: { include: { question: true } } } }
          : { select: { id: true, updatedAt: true, deadlineId: true } }),
      });
      return {
        relationId: `A-${project.id}`,
        fromUser: project.adviser
          ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (({ password, ...rest }) => rest)(project.adviser.user as User)
          : undefined,
        toProject: flattenProjectUsers(project),
        submission: submissions.length > 0 ? submissions : undefined,
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

export const getEvaluationSubmissions = async (query: any) => {
  const { deadlineId } = query;

  if (deadlineId) {
    return await getEvaluationSubmissionsByDeadlineId(query);
  }
  return await getAllEvaluationSubmissions(query);
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
  const deadlineType = query.deadlineType ?? DeadlineType.Evaluation;
  const isFeedback = deadlineType === DeadlineType.Feedback;
  const includeAnswers =
    query.includeAnswers === "true" || query.includeAnswers === true;

  const deadline = await findUniqueDeadline({
    where: { id: Number(deadlineId) },
  });

  let results: any[] = [];
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

  const includeTeams =
    includesTeamEvaluator(deadline.evaluatorType) &&
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
        ...(isFeedback
          ? {
              toProject: {
                cohortYear: Number(cohortYear),
                hasDropped: isDropped,
              },
            }
          : {
              fromProject: {
                cohortYear: Number(cohortYear),
                hasDropped: isDropped,
              },
            }),
        ...teamSearchCondition,
      },
    });

    const evaluatorProjectIds = Array.from(
      new Set(
        relations.map((relation) =>
          isFeedback ? relation.toProjectId : relation.fromProjectId
        )
      )
    );
    const evaluatorProjects = await findManyProjectsWithUserData({
      where: { id: { in: evaluatorProjectIds } },
    });
    const projectsWithStudentsMap = new Map(
      evaluatorProjects.map((p) => [p.id, p.students])
    );

    const pTeamSubmissions = relations.map(async (relation) => {
      const evaluatorProject = isFeedback
        ? relation.toProject
        : relation.fromProject;
      const evaluateeProject = isFeedback
        ? relation.fromProject
        : relation.toProject;
      const submission = await findFirstNonDraftSubmission({
        where: {
          deadlineId: Number(deadlineId),
          fromProjectId: evaluatorProject.id,
          toProjectId: evaluateeProject.id,
        },
        include: includeAnswers
          ? { answers: { include: { question: true } } }
          : undefined,
      });

      const rawStudents =
        projectsWithStudentsMap.get(evaluatorProject.id) || [];
      const flattenedStudents = rawStudents.map((student) =>
        flattenStudentUser(student)
      );

      const adviser = evaluatorProject.adviser;
      const sanitizedAdviser = adviser ? flattenAdviserUser(adviser) : null;

      return {
        relationId: isFeedback ? `F-T-${relation.id}` : relation.id,
        fromProject: {
          ...evaluatorProject,
          adviser: sanitizedAdviser,
          students: flattenedStudents,
        },
        toProject: flattenProjectUsers(evaluateeProject),
        submission: submission || undefined,
      };
    });
    results.push(...(await Promise.all(pTeamSubmissions)));

    if (isFeedback) {
      const teamAdviserProjects = await findManyProjectsWithUserData({
        where: {
          cohortYear: Number(cohortYear),
          hasDropped: isDropped,
          adviserId: { not: null },
          ...adviserSearchCondition,
        },
      });
      const teamAdviserSubmissions = teamAdviserProjects.map(
        async (project) => {
          if (!project.adviser) return null;
          const submission = await findFirstNonDraftSubmission({
            where: {
              deadlineId: Number(deadlineId),
              fromProjectId: project.id,
              toUserId: project.adviser.userId,
            },
            include: includeAnswers
              ? { answers: { include: { question: true } } }
              : undefined,
          });
          return {
            relationId: `F-A-${project.id}`,
            fromProject: flattenProjectUsers(project),
            toUser: withoutPassword(project.adviser.user),
            submission: submission || undefined,
          };
        }
      );
      results.push(
        ...(await Promise.all(teamAdviserSubmissions)).filter(Boolean)
      );
    }
  }

  const includeAdvisers =
    includesAdviserEvaluator(deadline.evaluatorType) &&
    (!evaluatorTypeFilter ||
      evaluatorTypeFilter === "All" ||
      evaluatorTypeFilter === "Adviser");

  if (includeAdvisers) {
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
        include: includeAnswers
          ? { answers: { include: { question: true } } }
          : undefined,
      });

      const adviserUser: any = adviser.user;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...sanitizedUser } = adviserUser || {};

      return {
        relationId: `A-${project.id}`,
        fromUser: sanitizedUser,
        toProject: flattenProjectUsers(project),
        submission: submission || undefined,
      };
    });
    const resolvedAdviserSubmissions = await Promise.all(pAdviserSubmissions);
    results.push(
      ...resolvedAdviserSubmissions.filter(
        (res): res is NonNullable<typeof res> => res !== null
      )
    );
  }

  if (submissionStatus) {
    results = results.filter((result) => {
      const sub = result.submission;
      if (submissionStatus == SubmissionStatusEnum.UNSUBMITTED) return !sub;
      if (submissionStatus == SubmissionStatusEnum.SUBMITTED_LATE)
        return sub && deadline.dueBy && sub.updatedAt > deadline.dueBy;
      if (submissionStatus == SubmissionStatusEnum.SUBMITTED)
        return !!sub && deadline.dueBy && sub.updatedAt <= deadline.dueBy;
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
