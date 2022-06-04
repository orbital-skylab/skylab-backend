/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "@prisma/client";
import {
  createManyMentors,
  createMentor,
  getFirstMentor,
  getManyMentors,
} from "src/models/mentors.db";

/**
 * @function getMentorInputParser Parse the input returned from the prisma.mentor.find function
 * @param mentor The payload returned from prisma.mentor.find
 * @returns Flattend object with both User and Mentor Data
 */
export const getMentorInputParser = (
  mentor: Prisma.MentorGetPayload<{ include: { user: true } }>
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user, id, ...data } = mentor;
  return { ...user, ...data, mentorId: id };
};

/**
 * @function getMentorByEmail Retrieve a mentor with the given email
 * @param email The email of the mentor to retrieve
 * @returns The mentor record with the given email
 */
export const getMentorByEmail = async (email: string) => {
  const mentor = await getFirstMentor({
    where: { user: { email: email } },
    orderBy: { cohortYear: "desc" },
  });
  return getMentorInputParser(mentor);
};

/**
 * @function getFilteredMentorsWhereInputParser Parse the query from the HTTP Request and returns a query object
 * for prisma.mentor.findMany
 * @param query The raw query object from the HTTP Request
 * @returns A filter object that works with prisma.mentor.findMany
 */
export const getFilteredMentorsWhereInputParser = (query: any) => {
  let filter: Prisma.MentorFindManyArgs = {};

  if (query.page && query.limit) {
    filter = {
      take: Number(query.limit),
      skip: (query.page - 1) * query.limit,
    };
  }

  if (query.cohortYear) {
    filter = { ...filter, where: { cohortYear: Number(query.cohortYear) } };
  }

  return filter;
};

/**
 * Retrieve a list of mentors that match the given query parameters
 * @param query The query parameters retrieved from the HTTP Request
 * @returns Array of Mentor Records that match the given query
 */
export const getFilteredMentors = async (query: any) => {
  const filteredQuery = getFilteredMentorsWhereInputParser(query);
  const mentors = await getManyMentors(filteredQuery);
  const parsedMentors = mentors.map((mentor) => getMentorInputParser(mentor));
  return parsedMentors;
};

/**
 * @function createMentorInputParser Parse the query body received from the HTTP Request
 * to be passed to prisma.mentor.create
 * @param body The raw query from the HTTP Request
 * @returns The create input to be passed to prisma.mentor.create
 */
export const createMentorInputParser = (
  body: any
): {
  user: Prisma.UserCreateInput;
  cohortYear: number;
} => {
  const { cohortYear, ...user } = body;
  const userData = <Prisma.UserCreateInput>user;
  return {
    user: userData,
    cohortYear: Number(cohortYear),
  };
};

/**
 * Helper function to create a mentor
 * @param body THe mentor information from the HTTP Request
 * @returns The mentor record created in the database
 */
export const createMentorHelper = async (body: any) => {
  const { user, cohortYear } = createMentorInputParser(body);
  return await createMentor(user, {
    cohort: { connect: { academicYear: cohortYear } },
  });
};

/**
 * @function createManyMentorsHelper Helper function to create many mentors simultaenously
 * @param body The array of mentor datum from the HTTP Request
 * @returns The mentor records created in the database
 */
export const createManyMentorsHelper = async (
  body: { user: Prisma.UserCreateInput; cohortYear: number }[]
) => {
  const mentors = body.map((data) => {
    const { user, cohortYear } = data;
    return {
      user: user,
      mentor: { cohort: { connect: { academicYear: cohortYear } } },
    };
  });
  return await createManyMentors(mentors);
};
