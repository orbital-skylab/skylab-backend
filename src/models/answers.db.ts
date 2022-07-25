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
