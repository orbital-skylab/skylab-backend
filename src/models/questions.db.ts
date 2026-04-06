import { Prisma } from "@prisma/client";
import { prisma } from "../client";

export const createOneQuestion = async (query: Prisma.QuestionCreateArgs) => {
  const sanitizedQuery: Prisma.QuestionCreateArgs = {
    ...query,
    data: {
      ...query.data,
      urlType: query.data.urlType ?? undefined,
      urlValidationRules: query.data.urlValidationRules ?? undefined,
    },
  };
  const createdQuestion = await prisma.question.create(sanitizedQuery);
  return createdQuestion;
};

export const deleteManyQuestions = async (
  query: Prisma.QuestionDeleteManyArgs
) => {
  const deletedQuestions = await prisma.question.deleteMany(query);
  return deletedQuestions;
};
