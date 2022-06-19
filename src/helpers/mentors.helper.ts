/* eslint-disable @typescript-eslint/no-explicit-any */
import { Mentor, Prisma, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneMentor,
  getManyMentors,
  getOneMentor,
} from "src/models/mentors.db";
import { createOneUser, createManyUsers } from "src/models/users.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { hashPassword, generateRandomHashedPassword } from "./users.helper";

/**
 * @function getMentorInputParser Parse the input returned from the prisma.mentor.find function
 * @param mentor The payload returned from prisma.mentor.find
 * @returns Flattened object with both User and Mentor Data
 */
export const getMentorInputParser = (
  mentor: Prisma.MentorGetPayload<{ include: { user: true } }>
) => {
  const { user, id, ...data } = mentor;
  return { ...user, ...data, mentorId: id };
};

export const getMentorById = async (mentorId: string) => {
  const mentor = await getOneMentor({ where: { id: Number(mentorId) } });
  return getMentorInputParser(mentor);
};

/**
 * @function getMentorsFilterParser Parse the query from the HTTP Request and returns a query object
 * for prisma.mentor.findMany
 * @param query The raw query object from the HTTP Request
 * @returns A filter object that works with prisma.mentor.findMany
 */
export const getMentorsFilterParser = (query: any) => {
  let filter: Prisma.MentorFindManyArgs = {};

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
 * @function getFilteredMentors Retrieve a list of mentors that match the given query parameters
 * @param query The query parameters retrieved from the HTTP Request
 * @returns Array of Mentor Records that match the given query
 */
export const getFilteredMentors = async (query: any) => {
  const filteredQuery = getMentorsFilterParser(query);
  const mentors = await getManyMentors(filteredQuery);
  const parsedMentors = mentors.map((mentor) => getMentorInputParser(mentor));
  return parsedMentors;
};

export const createNewMentorParser = async (
  body: any,
  isAdmin: boolean
): Promise<{
  user: Prisma.UserCreateInput;
  mentor: Prisma.MentorCreateInput;
}> => {
  const { mentor, user } = body;
  if (!mentor || !user || (isAdmin && !user.password)) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  user.password = user.password
    ? await hashPassword(user.password)
    : await generateRandomHashedPassword();

  return {
    user,
    mentor,
  };
};

export const createNewMentor = async (body: any, isAdmin?: boolean) => {
  const account = await createNewMentorParser(body, isAdmin ?? false);

  return await createOneUser({
    data: { ...account.user, mentor: { create: account.mentor } },
  });
};

export const createManyMentorsParser = async (
  body: any,
  isAdmin: boolean
): Promise<
  {
    user: Prisma.UserCreateInput;
    mentor: Prisma.MentorCreateInput;
  }[]
> => {
  const { count, accounts } = body;

  if (!count || !accounts) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }
  if (count !== accounts.length) {
    throw new SkylabError(
      "Count and Accounts Data do not match",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const promises: Promise<string>[] = [];
  accounts.forEach((account: { mentor: Mentor; user: User }) => {
    const { user } = account;

    if (isAdmin && !user.password) {
      throw new SkylabError(
        "All accounts should have a password input",
        HttpStatusCode.BAD_REQUEST
      );
    }

    promises.push(
      user.password
        ? hashPassword(user.password)
        : generateRandomHashedPassword()
    );
  });

  await Promise.all(promises);
  return accounts;
};

export const createManyMentors = async (body: any, isAdmin?: boolean) => {
  const accounts = await createManyMentorsParser(body, isAdmin ?? false);
  const prismaArgsArray: Prisma.UserCreateArgs[] = accounts.map((account) => {
    return { data: { ...account.user, mentor: { create: account.mentor } } };
  });
  return await createManyUsers(prismaArgsArray);
};

export const addMentorToAccountParser = (
  body: any
): Prisma.MentorCreateInput & { cohortYear: number } => {
  if (!body.mentor) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  return body.mentor;
};

export const addMentorToAccount = async (userId: string, body: any) => {
  const mentor = addMentorToAccountParser(body);
  const { cohortYear, ...mentorData } = mentor;
  return await createOneMentor({
    data: {
      ...mentorData,
      cohort: { connect: { academicYear: cohortYear } },
      user: { connect: { id: Number(userId) } },
    },
  });
};
