import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import {
  unknownInternalServerError,
  userEmailNotFoundError,
} from "src/utils/errors";

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
 * @function createUser Insert user into the database
 * @param userToCreate User to be created
 * @returns User that was created by the database
 */
export const createUser = async (
  userToCreate: Prisma.UserCreateInput | IUser
) => {
  const createUser = await prisma.user.create({ data: userToCreate });
  return createUser;
};

/**
 * @function createManyUsers Insert multiple users into the database
 * @param usersToCreate Array of users to be created
 * @returns Number of user records created
 */
export const createManyUsers = async (
  usersToCreate: Prisma.UserCreateInput[] | IUser[]
) => {
  try {
    const createUsers = await prisma.user.createMany({
      data: usersToCreate,
      skipDuplicates: false, // skip if unique fields are equal
    });
    return createUsers.count;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new Error("User data has conflicting unique inputs");
    }

    throw e;
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
  const users = await prisma.user.findUnique({
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
  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (user == null) {
      throw new Error("User not found");
    }

    return user;
  } catch (e) {
    throw e;
  }
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
      throw userEmailNotFoundError;
    }

    throw unknownInternalServerError;
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
      throw userEmailNotFoundError;
    }

    throw unknownInternalServerError;
  }
};
