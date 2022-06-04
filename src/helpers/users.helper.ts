import { Prisma } from "@prisma/client";
import {
  deleteOneUser,
  getManyUsers,
  getOneUser,
  updateOneUser,
} from "src/models/users.db";

/**
 * @function getAllUsers Get all user records in the database
 * @returns An array of all user records in the database
 */
export const getAllUsers = async () => {
  const allUsers = await getManyUsers({});
  return allUsers;
};

/**
 * @function getUserByEmail Get the user with the specified email
 * @param email The email of the user to retrieve
 * @returns The User Record with the given email
 */
export const getUserByEmail = async (email: string) => {
  const user = await getOneUser({ where: { email: email } });
  return user;
};

/**
 * @function updateUserByEmail Update the user with the specified email
 * @param email The email of the user to update
 * @param updates The updates required for the user record
 */
export const updateUserByEmail = async (
  email: string,
  updates: Prisma.UserUpdateInput
) => {
  return await updateOneUser({ where: { email: email }, data: updates });
};

/**
 * @function deleteUserByEmail Delete the user with the specified email
 * @param email The email of the user to delete
 */
export const deleteUserByEmail = async (email: string) => {
  return await deleteOneUser({ where: { email: email } });
};
