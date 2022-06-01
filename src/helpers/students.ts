import { Prisma, User, Student } from "@prisma/client";
import {
  createStudentUser,
  getAllStudents,
  getStudentByEmail,
} from "src/models/students.db";

export interface ICreateStudent {
  nusnetId?: string;
  matricNo?: string;
}

export interface ICreateStudentUser {
  user: Prisma.UserCreateInput;
  student: ICreateStudent;
}

export const parseCreateInput = (
  rawUserInfo: ICreateStudent & Prisma.UserCreateInput
) => {
  const student = {
    nusnetId: rawUserInfo.nusnetId ? rawUserInfo.nusnetId : undefined,
    matricNo: rawUserInfo.matricNo ? rawUserInfo.matricNo : undefined,
  };
  delete rawUserInfo["nusnetId"];
  delete rawUserInfo["matricNo"];
  return {
    user: rawUserInfo,
    student: student,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createUserParsed = async (userToCreate: any) => {
  const parsedUserToCreate = parseCreateInput(userToCreate);
  await createStudentUser(parsedUserToCreate);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createManyStudentUsersParsed = async (usersToCreate: any[]) => {
  const parsedUsersToCreate = usersToCreate.map((user) => {
    return parseCreateInput(user);
  });
  await createManyStudentUsersParsed(parsedUsersToCreate);
};

export interface IGetStudent {
  Student?: Student | null;
}

/**
 * @function parseGetInput Helper function to parse student/user information retrieved from get student/user methods
 * @param rawGetInfo Raw student/user information retrieved from the database
 * @returns Parsed student/user data
 */
export const parseGetInput = (rawGetInfo: User & IGetStudent) => {
  const student = rawGetInfo.Student;
  delete rawGetInfo["Student"];
  return { ...rawGetInfo, ...student };
};

/**
 * @function getStudentByEmailParsed Function to parse student/useri nformation retrieved from getStudentByEmail
 * @param email Email of student to retrieve data for
 * @returns Parsed student/user data for of the given email
 */
export const getStudentByEmailParsed = async (email: string) => {
  const studentByEmail = await getStudentByEmail(email);
  return parseGetInput(studentByEmail);
};

/**
 * @function getAllStudentsParsed Parser function for getAllStudents
 * @returns Array of parsed student information
 */
export const getAllStudentsParsed = async () => {
  const allStudents = await getAllStudents();
  const allStudentsParsed = allStudents.map((student) => {
    return parseGetInput(student);
  });
  return allStudentsParsed;
};
