import { Prisma } from "@prisma/client";
import { prisma } from "src/client";

export async function createUniqueAnswer(query: Prisma.AnswerCreateArgs) {
  const createdAnswer = await prisma.answer.create(query);
  return createdAnswer;
}

export async function deleteManyAnswers(query: Prisma.AnswerDeleteManyArgs) {
  const deleteAnswers = await prisma.answer.deleteMany(query);
  return deleteAnswers;
}

export async function getAnonymousAnswers(
  query: {
    deadlineId: number;
    toUserId?: number;
    toProjectId?: number;
  },
  anonymousQuestionIds: number[]
) {
  const { deadlineId, toUserId, toProjectId } = query;
  const answers = await prisma.answer.findMany({
    where: {
      submission: {
        isDraft: false,
        deadlineId: deadlineId,
        toUserId: toUserId,
        toProjectId: toProjectId,
      },
      questionId: { in: anonymousQuestionIds },
    },
  });
  return answers;
}
