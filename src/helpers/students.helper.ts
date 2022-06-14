/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "@prisma/client";
import {
  createManyStudents,
  createStudent,
  getFirstStudent,
  getManyStudents,
} from "src/models/students.db";
import { generateRandomHashedPassword } from "./users.helper";

/**
 * @function getStudentInputParser Parse the input returned from the prisma.student.find function
 * @param student The payload returned from prisma.student.find
 * @returns Flattened object with both User and Student Data
 */
export const getStudentInputParser = (
  student: Prisma.StudentGetPayload<{ include: { user: true } }>
) => {
  const { user, id, ...data } = student;
  return { ...user, ...data, studentId: id };
};

/**
 * Retrieve a student with the given email
 * @param email The email of the student to retrieve
 * @returns The student record with the given email
 */
export const getStudentByEmail = async (email: string) => {
  const student = await getFirstStudent({
    where: { user: { email: email } },
    orderBy: { cohortYear: "desc" },
  });
  return getStudentInputParser(student);
};

/**
 * @function getFilteredStudentsWhereInputParser Parse the query from the
 * HTTP Request and returns a query object for prisma.student.findMany
 * @param query The raw query object from the HTTP Request
 * @returns A filter object that works with prisma.student.findMany
 */
export const getFilteredStudentsWhereInputParser = (query: any) => {
  let filter: Prisma.StudentFindManyArgs = {};
  if (query.page && query.limit) {
    filter = {
      take: Number(query.page),
      skip: (query.page - 1) * query.limit,
    };
  }

  if (query.cohortYear) {
    filter = { ...filter, where: { cohortYear: Number(query.cohortYear) } };
  }

  return filter;
};

/**
 * @function getFilteredStudents Retrieve a list of students that match the given query conditions
 * @param query The query parameters retrieved from the HTTP Request
 * @returns Array of Student Records that match the given query
 */
export const getFilteredStudents = async (query: any) => {
  const filteredQuery = getFilteredStudentsWhereInputParser(query);
  const students = await getManyStudents(filteredQuery);
  const parsedStudents = students.map((student) =>
    getStudentInputParser(student)
  );
  return parsedStudents;
};

/**
 * @function createStudentInputParser Parse the query body received from
 * the HTTP Request to be passed to prisma.student.create
 * @param body The raw query body from the HTTP Request
 * @returns The create input to be passed to prisma.student.create
 */
export const createStudentInputParser = async (body: any) => {
  const { nusnetId, matricNo, cohortYear, ...userWithoutPassword } = body;
  const hashedPassword = await generateRandomHashedPassword();
  const user = { ...userWithoutPassword, password: hashedPassword };
  const userData = <Prisma.UserCreateInput>user;
  return {
    user: userData,
    student: {
      nusnetId: nusnetId ? String(nusnetId) : undefined,
      matricNo: matricNo ? String(matricNo) : undefined,
      cohort: { connect: { academicYear: Number(cohortYear) } },
    },
  };
};

/**
 * @function createStudentHelper Helper function to create a student
 * @param body The raw query body from the HTTP Request
 * @returns The student record created
 */
export const createStudentHelper = async (body: any) => {
  const { user, student } = await createStudentInputParser(body);
  return await createStudent(user, student);
};

/**
 * @function createManyStudentsHelper Helper function to create many students simultaenously
 * @param body The array of student datum from the HTTP Request
 * @returns The student records created in the database
 */
export const createManyStudentsHelper = async (body: any[]) => {
  const students = await Promise.all(
    body.map((data) => createStudentInputParser(data))
  );
  return await createManyStudents(students);
};
