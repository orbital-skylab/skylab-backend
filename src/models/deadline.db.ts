import { Prisma } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { prisma } from "../client";

export async function findFirstDeadline(query: Prisma.DeadlineFindFirstArgs) {
  const firstDeadline = await prisma.deadline.findFirst({
    ...query,
    rejectOnNotFound: false,
  });
  if (!firstDeadline) {
    throw new SkylabError("Deadline was not found", HttpStatusCode.BAD_REQUEST);
  }
  return firstDeadline;
}

export async function findUniqueDeadlineWithQuestionsData({
  include,
  ...query
}: Prisma.DeadlineFindUniqueArgs) {
  const uniqueDeadline = await prisma.deadline.findUnique({
    ...query,
    include: {
      ...include,
      sections: {
        include: {
          questions: {
            include: { options: { orderBy: { order: "asc" } } },
            orderBy: { questionNumber: "asc" },
          },
        },
        orderBy: { sectionNumber: "asc" },
      },
    },
  });

  if (!uniqueDeadline) {
    throw new SkylabError("Deadline was not found", HttpStatusCode.BAD_REQUEST);
  }
  return uniqueDeadline;
}

export async function findUniqueDeadline(query: Prisma.DeadlineFindUniqueArgs) {
  const uniqueDeadline = await prisma.deadline.findUnique(query);
  if (!uniqueDeadline) {
    throw new SkylabError("Deadline was not found", HttpStatusCode.BAD_REQUEST);
  }
  return uniqueDeadline;
}

export async function findManyDeadlines(query: Prisma.DeadlineFindManyArgs) {
  const deadlines = await prisma.deadline.findMany(query);
  return deadlines;
}

export async function findManyDeadlinesWithQuestionsData({
  include,
  ...query
}: Prisma.DeadlineFindManyArgs) {
  const deadlines = await prisma.deadline.findMany({
    ...query,
    include: {
      ...include,
      sections: {
        include: {
          questions: {
            include: { options: { orderBy: { order: "asc" } } },
            orderBy: { questionNumber: "asc" },
          },
        },
        orderBy: { sectionNumber: "asc" },
      },
    },
  });
  return deadlines;
}

export async function updateOneDeadline(query: Prisma.DeadlineUpdateArgs) {
  const updatedDeadline = await prisma.deadline.update(query);
  return updatedDeadline;
}

export async function deleteOneDeadline(query: Prisma.DeadlineDeleteArgs) {
  const deletedDeadline = await prisma.deadline.delete(query);
  return deletedDeadline;
}

export async function createOneDeadline(query: Prisma.DeadlineCreateArgs) {
  const createdDeadline = await prisma.deadline.create(query);
  return createdDeadline;
}
