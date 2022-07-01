/* eslint-disable @typescript-eslint/no-explicit-any */
import { Adviser, Prisma, PrismaClient, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneAdviser,
  findManyAdvisersWithUserData,
  findUniqueAdviserWithUserData,
} from "src/models/advisers.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { generateRandomPassword, hashPassword } from "./authentication.helper";
import { removePasswordFromUser } from "./users.helper";

const prismaClient = new PrismaClient();

export function parseGetAdviserInput(
  adviser: Prisma.AdviserGetPayload<{ include: { user: true } }>
) {
  const { user, id, ...data } = adviser;
  return { ...user, ...data, adviserId: id };
}

export async function getManyAdvisersWithFilter(
  query: any & {
    limit?: number;
    page?: number;
    cohortYear?: number;
  }
) {
  const { limit, page, cohortYear } = query;
  /* Create Filter Object */
  const adviserQuery: Prisma.AdviserFindManyArgs = {
    take: limit ?? undefined,
    skip: limit && page ? limit * page : undefined,
    where: cohortYear
      ? {
          cohortYear: cohortYear,
        }
      : undefined,
  };

  /* Fetch Advisers with Filter Object */
  const advisers = await findManyAdvisersWithUserData(adviserQuery);

  /* Parse Advisers Objects */
  const parsedAdvisers = advisers.map((adviser) =>
    parseGetAdviserInput(adviser)
  );

  return parsedAdvisers;
}

export async function getOneAdviserById(adviserId: number) {
  const adviser = await findUniqueAdviserWithUserData({
    where: { id: adviserId },
  });
  return parseGetAdviserInput(adviser);
}

export async function createUserWithAdviserRole(body: any, isDev?: boolean) {
  const { adviser, user } = body;
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

  const { cohortYear, ...adviserData } = adviser;

  const [createdUser, createdAdviser] = await prismaClient.$transaction([
    prismaClient.user.create({ data: user }),
    prismaClient.adviser.create({
      data: {
        ...adviserData,
        user: { connect: { email: user.email } },
        cohort: { connect: { academicYear: cohortYear } },
      },
    }),
  ]);

  return {
    user: removePasswordFromUser(createdUser),
    adviser: createdAdviser,
  };
}

export async function createManyUsersWithAdviserRole(
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
      adviser: Adviser;
    }): Promise<{ user: User; adviser: Adviser & { cohortYear: number } }> => {
      if (isDev && !account.user.password) {
        throw new SkylabError(
          "All accounts should have a password input",
          HttpStatusCode.BAD_REQUEST
        );
      }
      const { user, adviser } = account;
      const password =
        isDev && user.password
          ? await hashPassword(user.password)
          : await generateRandomPassword();
      return {
        user: {
          ...user,
          password,
        },
        adviser,
      };
    }
  );
  await Promise.all(accounts);

  const createdAccounts = [];
  for (const account of accounts) {
    const { user, adviser } = account;
    const { cohortYear, ...adviserData } = adviser;
    const [createdUser, createdAdviser] = await prismaClient.$transaction([
      prismaClient.user.create({ data: user }),
      prismaClient.adviser.create({
        data: {
          ...adviserData,
          user: { connect: { email: user.email } },
          cohort: { connect: { academicYear: cohortYear } },
        },
      }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...createdUserWithoutPassword } = createdUser;
    createdAccounts.push({
      ...createdUserWithoutPassword,
      adviser: createdAdviser,
    });
  }

  return createdAccounts;
}

export async function addAdviserRoleToUser(userId: string, body: any) {
  const { adviser } = body;
  const { cohortYear, ...adviserData } = adviser;
  return await createOneAdviser({
    data: {
      ...adviserData,
      cohort: { connect: { academicYear: cohortYear } },
      user: { connect: { id: Number(userId) } },
    },
  });
}
