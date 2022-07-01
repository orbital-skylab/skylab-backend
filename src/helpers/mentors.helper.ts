/* eslint-disable @typescript-eslint/no-explicit-any */
import { Mentor, Prisma, PrismaClient, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneMentor,
  getManyMentors,
  getOneMentor,
} from "src/models/mentors.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { hashPassword, generateRandomHashedPassword } from "./users.helper";

const prismaClient = new PrismaClient();

/**
 * @function getMentorInputParser Parse the input returned from the prisma.mentor.find function
 * @param mentor The payload returned from prisma.mentor.find
 * @returns Flattened object with both User and Mentor Data
 */
export const parseGetMentorsInput = (
  mentor: Prisma.MentorGetPayload<{ include: { user: true } }>
) => {
  const { user, id, ...data } = mentor;
  return { ...user, ...data, mentorId: id };
};

export const getMentorById = async (mentorId: string) => {
  const mentor = await getOneMentor({ where: { id: Number(mentorId) } });
  return parseGetMentorsInput(mentor);
};

/**
 * @function getMentorsFilterParser Parse the query from the HTTP Request and returns a query object
 * for prisma.mentor.findMany
 * @param query The raw query object from the HTTP Request
 * @returns A filter object that works with prisma.mentor.findMany
 */
export const parseGetMentorsFilter = (query: any) => {
  return {
    take: query.limit ?? undefined,
    skip: query.page * query.limit ?? undefined,
    where: { cohortYear: query.cohortYear } ?? undefined,
  };
};

/**
 * @function getFilteredMentors Retrieve a list of mentors that match the given query parameters
 * @param query The query parameters retrieved from the HTTP Request
 * @returns Array of Mentor Records that match the given query
 */
export const getFilteredMentors = async (query: any) => {
  const filteredQuery = parseGetMentorsFilter(query);
  const mentors = await getManyMentors(filteredQuery);
  const parsedMentors = mentors.map((mentor) => parseGetMentorsInput(mentor));
  return parsedMentors;
};

export const createNewMentorParser = async (
  body: any,
  isDev: boolean
): Promise<{
  user: Prisma.UserCreateInput;
  mentor: Prisma.MentorCreateInput & { cohortYear: number };
}> => {
  const { mentor, user } = body;
  if (isDev && !user.password) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  user.password =
    isDev && user.password
      ? await hashPassword(user.password)
      : await generateRandomHashedPassword();

  return { mentor, user };
};

export const createNewMentor = async (body: any, isDev?: boolean) => {
  const account = await createNewMentorParser(body, isDev ?? false);

  const { user, mentor } = account;
  const { cohortYear, ...mentorData } = mentor;

  const [createdUser, createdMentor] = await prismaClient.$transaction([
    prismaClient.user.create({ data: user }),
    prismaClient.mentor.create({
      data: {
        ...mentorData,
        user: { connect: { email: user.email } },
        cohort: { connect: { academicYear: cohortYear } },
      },
    }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...createdUserWithoutPassword } = createdUser;
  return {
    ...createdUserWithoutPassword,
    mentor: createdMentor,
  };
};

export const createManyMentorsParser = async (
  body: any,
  isDev: boolean
): Promise<
  {
    user: Prisma.UserCreateInput;
    mentor: Prisma.MentorCreateInput & { cohortYear: number };
  }[]
> => {
  const { count, accounts } = body;

  if (count !== accounts.length) {
    throw new SkylabError(
      "Count and Accounts Data do not match",
      HttpStatusCode.BAD_REQUEST
    );
  }

  accounts.map(
    async (account: {
      user: User;
      mentor: Mentor;
    }): Promise<{ user: User; mentor: Mentor & { cohortYear: number } }> => {
      if (isDev && !account.user.password) {
        throw new SkylabError(
          "All accounts should have a password input",
          HttpStatusCode.BAD_REQUEST
        );
      }
      const { user, mentor } = account;
      const password =
        isDev && user.password
          ? await hashPassword(user.password)
          : await generateRandomHashedPassword();
      return {
        user: {
          ...user,
          password,
        },
        mentor,
      };
    }
  );
  await Promise.all(accounts);

  return accounts;
};

export const createManyMentors = async (body: any, isDev?: boolean) => {
  const accounts = await createManyMentorsParser(body, isDev ?? false);
  const createdAccounts: Array<
    Omit<User, "password"> & {
      mentor: Mentor & { cohortYear: number };
    }
  > = [];
  for (const account of accounts) {
    const { user, mentor } = account;
    const { cohortYear, ...mentorData } = mentor;
    const [createdUser, createdMentor] = await prismaClient.$transaction([
      prismaClient.user.create({ data: user }),
      prismaClient.mentor.create({
        data: {
          ...mentorData,
          user: { connect: { email: user.email } },
          cohort: { connect: { academicYear: cohortYear } },
        },
      }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...createdUserWithoutPassword } = createdUser;
    createdAccounts.push({
      ...createdUserWithoutPassword,
      mentor: createdMentor,
    });
  }

  return createdAccounts;
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
