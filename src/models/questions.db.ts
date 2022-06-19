import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createOneQuestion = async (query: Prisma.QuestionCreateArgs) => {
  const createdQuestion = await prisma.question.create(query);
  return createdQuestion;
};

export const deleteManyQuestions = async (
  query: Prisma.QuestionDeleteManyArgs
) => {
  const deletedQuestions = await prisma.question.deleteMany(query);
  return deletedQuestions;
};
