/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import { getManyStudents, getOneStudent } from "src/models/students.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

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

export const getStudentsFilterParser = (query: any) => {
  let filter: Prisma.StudentFindManyArgs = {};
  if ((query.page && !query.limit) || (query.limit && !query.page)) {
    throw new SkylabError(
      `${
        query.limit ? "Page" : "Limit"
      } parameter missing in a pagination query`,
      HttpStatusCode.BAD_REQUEST
    );
  }

  if (query.page && query.limit) {
    filter = {
      ...filter,
      take: Number(query.limit),
      skip: Number(query.page) * Number(query.limit),
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
  const filteredQuery = getStudentsFilterParser(query);
  const students = await getManyStudents(filteredQuery);
  const parsedStudents = students.map((student) =>
    getStudentInputParser(student)
  );
  return parsedStudents;
};

export const getStudentById = async (studentId: string) => {
  const student = await getOneStudent({ where: { id: Number(studentId) } });
  return getStudentInputParser(student);
};
