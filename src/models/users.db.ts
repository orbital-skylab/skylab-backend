import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const prisma = new PrismaClient();

export interface IUser {
  nusnetId: string | null | undefined;
  matricNo: string | null | undefined;
  name: string;
  email: string;
  profilePicUrl: string | null | undefined;
  githubUrl: string | null | undefined;
  linkedinUrl: string | null | undefined;
  personalSiteUrl: string | null | undefined;
  selfIntro: string | null | undefined;
}

/**
 * @function createManyAdviserUsers Function to create adviser users in the database
 * @param users Array of emails to create adviser accounts for
 * @returns The users that were created
 */
export const createManyAdviserUsers = async (
  users: Prisma.UserCreateInput[]
) => {
  try {
    const createdAdvisers = await Promise.all(
      users.map(async (user) => {
        return await prisma.user.create({
          data: { ...user, Adviser: { create: {} } },
        });
      })
    );
    return createdAdvisers;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "At least one user is not unique",
        HttpStatusCode.BAD_REQUEST
      );
    }
  }
};

/**
 * @function getAllUsers Return all users in the database
 * @returns All User Records in the database
 */
export const getAllUsers = async () => {
  const allUsers = await prisma.user.findMany();
  return allUsers;
};

/**
 * @function getUsers Return all users that match the given search criteria
 * @param searchCriteria Search Criteria to select upon
 * @returns list of users that match the given search criteria
 */
export const getUsers = async (searchCriteria: { [key: string]: string }) => {
  const users = await prisma.user.findMany({
    where: searchCriteria,
  });
  return users;
};

/**
 * @function getUserByEmail Return user with the specified unique email
 * @param email Email of user to be selected
 * @returns User that has the given email
 */
export const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (user == null) {
    throw new SkylabError(
      "User with given email was not found",
      HttpStatusCode.BAD_REQUEST
    );
  }

  return user;
};

export const updateUserByEmail = async (
  email: string,
  updates: Prisma.UserUpdateInput
) => {
  try {
    const updateUser = await prisma.user.update({
      where: {
        email: email,
      },
      data: updates,
    });
    return updateUser;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2025") {
      throw new SkylabError(
        "User with given email was not found",
        HttpStatusCode.BAD_REQUEST
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};

/**
 * @function deleteUserByEmail Delete user with the given email
 * @param email Email of user to be deleted
 * @returns User that was deleted from the database
 */
export const deleteUserByEmail = async (email: string) => {
  try {
    const deletedUser = await prisma.user.delete({
      where: {
        email: email,
      },
    });
    return deletedUser;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2025") {
      throw new SkylabError(
        "User with given email was not found",
        HttpStatusCode.BAD_REQUEST
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};
