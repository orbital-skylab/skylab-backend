import { Prisma } from "@prisma/client";
import { prisma } from "../client";

export async function createUniqueAnswer(query: Prisma.AnswerCreateArgs) {
  const createdAnswer = await prisma.answer.create(query);
  return createdAnswer;
}

export async function deleteManyAnswers(query: Prisma.AnswerDeleteManyArgs) {
  const deleteAnswers = await prisma.answer.deleteMany(query);
  return deleteAnswers;
}

export async function findManyAnswers(query: Prisma.AnswerFindManyArgs) {
  const answers = await prisma.answer.findMany(query);
  return answers;
}
