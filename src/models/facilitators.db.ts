import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

/**
 * @function getFirstFacilitator Find the first facilitator record with the given query conditions
 * @param query The query conditions for the user
 * @returns The first facilitator record that matches the query conditions
 */
export const getFirstFacilitator = async ({
  include,
  ...query
}: Prisma.FacilitatorFindFirstArgs) => {
  const facilitator = await prisma.facilitator.findFirst({
    include: { ...include, user: true },
    ...query,
    rejectOnNotFound: false,
  });

  if (!facilitator) {
    throw new SkylabError(
      "Facilitator was not found",
      HttpStatusCode.NOT_FOUND
    );
  }

  return facilitator;
};

/**
 * @function getOneFacilitator Find a unique facilitator record with the given query conditions
 * @param query The query conditions for the user
 * @returns The facilitator record that matches the query conditions
 */
export const getOneFacilitator = async ({
  include,
  ...query
}: Prisma.FacilitatorFindUniqueArgs) => {
  const facilitator = await prisma.facilitator.findUnique({
    include: { ...include, user: true },
    ...query,
    rejectOnNotFound: false,
  });

  if (!facilitator) {
    throw new SkylabError(
      "Facilitator was not found",
      HttpStatusCode.NOT_FOUND
    );
  }

  return facilitator;
};

/**
 * @function getManyFacilitators Find all the facilitators that match the given query conditions
 * @param query The query conditions to be selected upon
 * @returns The array of facilitator records that match the query conditions
 */
export const getManyFacilitators = async ({
  include,
  ...query
}: Prisma.FacilitatorFindManyArgs) => {
  const facilitators = await prisma.facilitator.findMany({
    include: { ...include, user: true },
    ...query,
  });
  return facilitators;
};

export const createOneFacilitator = async (
  facilitator: Prisma.FacilitatorCreateArgs
) => {
  try {
    return await prisma.facilitator.create(facilitator);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "Facilitator is not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
};

export const createManyFacilitators = async (
  facilitators: Prisma.FacilitatorCreateManyArgs
) => {
  try {
    return await prisma.facilitator.createMany(facilitators);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "One of the facilitators are not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }
  }
};
