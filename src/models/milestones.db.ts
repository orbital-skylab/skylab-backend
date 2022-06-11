import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

export const getFirstMilestone = async (
  query: Omit<Prisma.MilestoneFindFirstArgs, "rejectOnNotFound">
) => {
  const milestone = await prisma.milestone.findFirst({
    ...query,
    rejectOnNotFound: false,
  });

  if (!milestone) {
    throw new SkylabError("Milestone was not found", HttpStatusCode.NOT_FOUND);
  }

  return milestone;
};

export const getOneMilestone = async (
  query: Omit<Prisma.MilestoneFindUniqueArgs, "rejectOnNotFound">
) => {
  const milestone = await prisma.milestone.findUnique({
    ...query,
    rejectOnNotFound: false,
  });

  if (!milestone) {
    throw new SkylabError("Milestone was not found", HttpStatusCode.NOT_FOUND);
  }

  return milestone;
};

export const getManyMilestones = async (
  query: Prisma.MilestoneFindManyArgs
) => {
  const milestones = await prisma.milestone.findMany(query);
  return milestones;
};

export const createMilestone = async (
  milestone: Prisma.MilestoneCreateInput
) => {
  try {
    const newMilestone = await prisma.milestone.create({ data: milestone });
    return newMilestone;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "Milestone is not unique",
        HttpStatusCode.BAD_REQUEST
      );
    }

    if (e.code === "P2025") {
      throw new SkylabError(
        "No Project Data for the given Milestone",
        HttpStatusCode.BAD_REQUEST
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};
