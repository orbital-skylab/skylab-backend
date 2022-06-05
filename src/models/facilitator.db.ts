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
 * @function getManyMentors Find all the facilitators that match the given query conditions
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

/**
 * @function createFacilitator Create a Facilitator with an associated Facilitator Record
 * @param user The information to create the User Record
 * @param facilitator The information to create the Facilitator Record
 * @returns The facilitator object that was created
 */
export const createFacilitator = async (
  user: Omit<Prisma.UserCreateInput, "userId">,
  facilitator: Omit<Prisma.FacilitatorCreateInput, "user">
) => {
  try {
    const createdFacilitator = await prisma.facilitator.create({
      data: {
        user: {
          connectOrCreate: { where: { email: user.email }, create: user },
        },
        ...facilitator,
      },
    });
    return createdFacilitator;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "Facilitator is not unique",
        HttpStatusCode.BAD_REQUEST
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};

export interface IFacilitatorCreateMany {
  user: Prisma.UserCreateInput;
  facilitator: Omit<Prisma.FacilitatorCreateInput, "user">;
}

export const createManyFacilitators = async (
  data: IFacilitatorCreateMany[]
) => {
  try {
    const createdFacilitators = await Promise.all(
      data.map(async (userData) => {
        return await prisma.facilitator.create({
          data: { user: { create: userData.user }, ...userData.facilitator },
        });
      })
    );
    return createdFacilitators;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        `Facilitator ${e.meta} is not unique`,
        HttpStatusCode.BAD_REQUEST
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};
