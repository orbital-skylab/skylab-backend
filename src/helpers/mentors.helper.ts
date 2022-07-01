/* eslint-disable @typescript-eslint/no-explicit-any */
import { Mentor, Prisma, PrismaClient, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneMentor,
  findManyMentorsWithUserData,
  findUniqueMentorWithUserData,
} from "src/models/mentors.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { generateRandomPassword, hashPassword } from "./authentication.helper";
import { removePasswordFromUser } from "./users.helper";

const prismaClient = new PrismaClient();

export function parseGetMentorInput(
  mentor: Prisma.MentorGetPayload<{ include: { user: true } }>
) {
  const { user, id, ...data } = mentor;
  const userWithoutPassword = removePasswordFromUser(user);
  return { ...userWithoutPassword, ...data, mentorId: id };
}

export async function getManyMentorsWithFilter(
  query: any & {
    limit?: number;
    page?: number;
    cohortYear?: number;
  }
) {
  const { limit, page, cohortYear } = query;
  /* Create Filter Object */
  const mentorQuery: Prisma.MentorFindManyArgs = {
    take: limit ?? undefined,
    skip: limit && page ? limit * page : undefined,
    where: cohortYear
      ? {
          cohortYear: cohortYear,
        }
      : undefined,
  };

  /* Fetch Mentors with Filter Object */
  const mentors = await findManyMentorsWithUserData(mentorQuery);

  /* Parse Mentors Objects */
  const parsedMentors = mentors.map((mentor) => parseGetMentorInput(mentor));

  return parsedMentors;
}

export async function getOneMentorById(mentorId: number) {
  const mentor = await findUniqueMentorWithUserData({
    where: { id: mentorId },
  });
  return parseGetMentorInput(mentor);
}

export async function createUserWithMentorRole(body: any, isDev?: boolean) {
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
      : await generateRandomPassword();

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

  return {
    user: removePasswordFromUser(createdUser),
    mentor: createdMentor,
  };
}

export async function createManyUsersWithMentorRole(
  body: any,
  isDev?: boolean
) {
  const { count, accounts } = body;

  if (count != accounts.length) {
    throw new SkylabError(
      "Count and Projects Data do not match",
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
          : await generateRandomPassword();
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

  const createdAccounts = [];
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
}

export async function addMentorRoleToUser(userId: string, body: any) {
  const { mentor } = body;
  const { cohortYear, projectIds, ...mentorData } = mentor;
  const projectIdsToConnect: { id: number }[] | undefined = projectIds
    ? projectIds.map((projectId: any) => {
        return { id: Number(projectId) };
      })
    : undefined;
  return await createOneMentor({
    data: {
      ...mentorData,
      cohort: { connect: { academicYear: cohortYear } },
      user: { connect: { id: Number(userId) } },
      projects: projectIdsToConnect ?? undefined,
    },
  });
}
