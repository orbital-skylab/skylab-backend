import { Answer, Prisma } from "@prisma/client";
import { SkylabError } from "../errors/SkylabError";
import {
  createUniqueAnswer,
  deleteManyAnswers,
  findManyAnswers,
} from "../models/answers.db";
import {
  findManyDeadlinesWithAnonymousQuestionsData,
  findUniqueDeadlineWithQuestionsData,
} from "../models/deadline.db";
import {
  createUniqueSubmission,
  findManySubmissions,
  findUniqueSubmission,
  updateUniqueSubmission,
} from "../models/submissions.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { getOneAdviserById } from "./advisers.helper";
import { parseQuestionsInput } from "./deadline.helper";
import { getOneStudentById } from "./students.helper";
import { getProjectIDsByAdviserID } from "./projects.helper";
import { findUniqueUserWithRoleData } from "../models/users.db";

type SubmissionWithRelations = Prisma.SubmissionGetPayload<{
  include: {
    answers: { include: { question: true } };
    fromProject: true;
    fromUser: true;
    toProject: true;
    toUser: true;
  };
}>;

export async function getSubmissionBySubmissionId(
  submissionId: number,
  user: Awaited<ReturnType<typeof findUniqueUserWithRoleData>>
) {
  const submission = (await findUniqueSubmission({
    where: { id: submissionId },
    include: {
      answers: { include: { question: true } },
      fromProject: true,
      fromUser: true,
      toProject: true,
      toUser: true,
    },
  })) as SubmissionWithRelations | null;

  if (!submission) {
    throw new SkylabError(
      "Submission with this ID was not found",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const { deadlineId } = submission;
  const deadlineWithQuestions = await findUniqueDeadlineWithQuestionsData({
    where: { id: deadlineId },
  });

  const { sections, ...deadlineData } = deadlineWithQuestions;

  let parsedSections = sections.map((section) => {
    const { questions, ...sectionData } = section;
    return {
      ...sectionData,
      questions: parseQuestionsInput(questions),
    };
  });

  const isAuthor =
    (submission.fromProjectId &&
      submission.fromProjectId === user.student?.projectId) ||
    (submission.fromUserId && submission.fromUserId === user.id);

  const isAdmin = Boolean(user.administrator?.id);

  let filteredAnswers = submission.answers;

  if (!isAuthor && !isAdmin) {
    parsedSections = parsedSections.map((section) => ({
      ...section,
      questions: section.questions.filter((q) => !q.isAnonymous),
    }));

    const nonAnonymousQuestionIds = new Set(
      parsedSections.flatMap((s) => s.questions).map((q) => q.id)
    );

    filteredAnswers = submission.answers.filter((a) =>
      nonAnonymousQuestionIds.has(a.questionId)
    );
  }

  return {
    ...submission,
    answers: filteredAnswers,
    deadline: deadlineData,
    sections: parsedSections,
  };
}

export async function createOneSubmission(body: {
  submission: {
    deadlineId: number;
    answers?: Omit<Answer, "submissionId">[];
    fromProjectId?: number;
    fromUserId?: number;
    toProjectId?: number;
    toUserId?: number;
  };
}) {
  const { submission } = body;
  const {
    deadlineId,
    answers,
    fromProjectId,
    fromUserId,
    toProjectId,
    toUserId,
  } = submission;
  const createdSubmission = await createUniqueSubmission({
    data: {
      deadline: { connect: { id: deadlineId } },
      fromProject: fromProjectId
        ? { connect: { id: fromProjectId } }
        : undefined,
      toProject: toProjectId ? { connect: { id: toProjectId } } : undefined,
      fromUser: fromUserId ? { connect: { id: fromUserId } } : undefined,
      toUser: toUserId ? { connect: { id: toUserId } } : undefined,
    },
  });

  if (!answers) {
    return createdSubmission;
  }

  const createdAnswers = await Promise.all(
    answers.map(async ({ questionId, answer }) => {
      return await createUniqueAnswer({
        data: {
          submission: { connect: { id: createdSubmission.id } },
          question: { connect: { id: questionId } },
          answer: answer,
        },
      });
    })
  );

  return {
    ...createdSubmission,
    answers: createdAnswers,
  };
}

export async function updateOneSubmissionBySubmissionId(
  submissionId: number,
  data: { answers?: Omit<Answer, "submissionId">[]; isDraft?: boolean }
) {
  const { answers, isDraft } = data;

  if (answers) {
    await deleteManyAnswers({ where: { submissionId: submissionId } });
    await Promise.all(
      answers.map(async ({ questionId, answer }) => {
        return await createUniqueAnswer({
          data: {
            submission: { connect: { id: submissionId } },
            question: { connect: { id: questionId } },
            answer: answer,
          },
        });
      })
    );
  }

  if (typeof isDraft !== "undefined") {
    await updateUniqueSubmission({
      where: { id: submissionId },
      data: { isDraft: isDraft },
    });
  }

  return await findUniqueSubmission({ where: { id: submissionId } });
}

export async function getAnonymousAnswersViaAdviserID(adviserId: number) {
  const adviser = await getOneAdviserById(adviserId);
  const { cohortYear } = adviser;

  const adviserProjects = await getProjectIDsByAdviserID(adviserId);
  if (adviserProjects.length === 0) {
    throw new SkylabError(
      "This adviser is not in charge of any projects, and hence has no anonymous answers to view!",
      HttpStatusCode.BAD_REQUEST
    );
  }
  const projectIds = adviserProjects.map((p) => p.id);

  const deadlines = await findManyDeadlinesWithAnonymousQuestionsData({
    where: { cohortYear: cohortYear },
  });

  const pDeadlinesWithSubmissionData = deadlines.map(
    async ({ sections, ...deadline }) => {
      const submissions = await findManySubmissions({
        where: {
          deadlineId: deadline.id,
          isDraft: false,
          OR: [
            { toProjectId: { in: projectIds } },
            { toUserId: adviser.userId },
          ],
        },
      });

      const answers = await Promise.all(
        submissions.map(async (submission) => {
          const answers = await findManyAnswers({
            where: {
              submissionId: submission.id,
              question: { isAnonymous: true },
            },
          });
          return answers;
        })
      );

      return {
        deadline: deadline,
        sections: sections.map((section) => {
          const { questions, ...sectionData } = section;
          return {
            ...sectionData,
            questions: parseQuestionsInput(questions),
          };
        }),
        answers: answers,
      };
    }
  );
  return await Promise.all(pDeadlinesWithSubmissionData);
}

export async function getAnonymousAnswersViaStudentID(studentId: number) {
  const student = await getOneStudentById(studentId);

  if (!student.projectId) {
    throw new SkylabError(
      "Student is not part of project",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const { cohortYear, projectId } = student;

  const deadlines = await findManyDeadlinesWithAnonymousQuestionsData({
    where: { cohortYear: cohortYear },
  });

  const pDeadlinesWithSubmissionData = deadlines.map(
    async ({ sections, ...deadline }) => {
      const submissions = await findManySubmissions({
        where: {
          deadlineId: deadline.id,
          isDraft: false,
          toProjectId: projectId,
        },
      });

      const answers = await Promise.all(
        submissions.map(async (submission) => {
          const answers = await findManyAnswers({
            where: {
              submissionId: submission.id,
              question: { isAnonymous: true },
            },
          });
          return answers;
        })
      );

      return {
        deadline: deadline,
        sections: sections.map((section) => {
          const { questions, ...sectionData } = section;
          return {
            ...sectionData,
            questions: parseQuestionsInput(questions),
          };
        }),
        answers: answers,
      };
    }
  );
  return await Promise.all(pDeadlinesWithSubmissionData);
}
