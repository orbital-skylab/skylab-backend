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
  const deadline = await prisma.deadline.findUnique({
    ...query,
    rejectOnNotFound: false,
  });

  if (!deadline) {
    throw new SkylabError("Deadline was not found", HttpStatusCode.BAD_REQUEST);
  }

  return deadline;
};

export const getManyDeadlines = async (query: Prisma.DeadlineFindManyArgs) => {
  const deadlines = await prisma.deadline.findMany(query);
  return deadlines;
};

export const createDeadline = async (
  deadline: Omit<Prisma.DeadlineCreateInput, "cohort">,
  cohortYear: number
) => {
  try {
    const createdDeadline = await prisma.deadline.create({
      data: { cohort: { connect: { academicYear: cohortYear } }, ...deadline },
    });
    return createdDeadline;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "Deadline is not unique",
        HttpStatusCode.BAD_REQUEST
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};
