import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

export const getFirstDeadline = async (query: Prisma.DeadlineFindFirstArgs) => {
  const deadline = await prisma.deadline.findFirst({
    ...query,
    rejectOnNotFound: false,
  });

  if (!deadline) {
    throw new SkylabError("Deadline was not found", HttpStatusCode.BAD_REQUEST);
  }

  return deadline;
};

export const getOneDeadline = async (query: Prisma.DeadlineFindUniqueArgs) => {
  try {
    const deadline = await prisma.deadline.findUnique({
      ...query,
      rejectOnNotFound: false,
    });
    if (!deadline) {
      throw new SkylabError(
        "Deadline was not found",
        HttpStatusCode.BAD_REQUEST,
        query.where
      );
    }
    return deadline;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2025") {
      throw new SkylabError(
        `Deadline where ${query.where} does not exist`,
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
};

export const getManyDeadlines = async (query: Prisma.DeadlineFindManyArgs) => {
  const deadlines = await prisma.deadline.findMany(query);
  return deadlines;
};

export const updateDeadline = async (query: Prisma.DeadlineUpdateArgs) => {
  try {
    const deadline = await prisma.deadline.update(query);

    return deadline;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2025") {
      throw new SkylabError(
        `Deadline where ${query.where} does not exist`,
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
};

export const createOneDeadline = async (
  deadline: Prisma.DeadlineCreateArgs
) => {
  try {
    return await prisma.deadline.create(deadline);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "Deadline is not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
};

export const deleteOneDeadline = async (query: Prisma.DeadlineDeleteArgs) => {
  try {
    const deadline = await prisma.deadline.delete(query);
    return deadline;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2025") {
      throw new SkylabError(
        `Deadline where ${query.where} does not exist`,
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
};
