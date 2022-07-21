/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneAdviser,
  deleteUniqueAdviser,
  findManyAdvisersWithUserData,
  findUniqueAdviserWithUserData,
  updateUniqueAdviser,
} from "src/models/advisers.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { generateRandomPassword, hashPassword } from "./authentication.helper";
import { getCurrentCohort } from "./cohorts.helper";
import { getOneStudentByNusnetId } from "./students.helper";
import { removePasswordFromUser } from "./users.helper";
import { prisma } from "../client";

export function parseGetAdviserInput(
  adviser: Prisma.AdviserGetPayload<{ include: { user: true } }>
) {
  const { user, id, ...data } = adviser;
  const userWithoutPassword = removePasswordFromUser(user);
  return { ...userWithoutPassword, ...data, adviserId: id };
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

  const { cohortYear, projectIds, ...adviserData } = adviser;

  const [createdUser, createdAdviser] = await prisma.$transaction([
    prisma.user.create({ data: user }),
    prisma.adviser.create({
      data: {
        ...adviserData,
        projects: projectIds
          ? {
              connect: projectIds.map((projectId: any) => {
                return { id: Number(projectId) };
              }),
            }
          : undefined,
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
  const { count, advisers } = body;

  if (count != advisers.length) {
    throw new SkylabError(
      "Count and Projects Data do not match",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const accountsWithHashedPasswords = await Promise.all(
    (
      advisers as {
        user: User;
        adviser: Prisma.AdviserCreateInput & { cohortYear: number };
      }[]
    ).map(async (account) => {
      if (isDev && !account.user.password) {
        throw new SkylabError(
          "All accounts should have a password input",
          HttpStatusCode.BAD_REQUEST
        );
      }

      const { user, adviser } = account;
      return {
        user: {
          ...user,
          password:
            isDev && user.password
              ? await hashPassword(user.password)
              : await generateRandomPassword(),
        },
        adviser,
      };
    })
  );

  const createdAccounts = [];
  for (const account of accountsWithHashedPasswords) {
    const { user, adviser } = account;
    const { cohortYear, ...adviserData } = adviser;
    const [createdUser, createdAdviser] = await prisma.$transaction([
      prisma.user.create({
        data: { ...user },
      }),
      prisma.adviser.create({
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

export async function addAdviserRoleToUser(userId: number, body: any) {
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

export async function editAdviserDataByAdviserID(adviserId: number, body: any) {
  const { adviser } = body;
  return await updateUniqueAdviser({
    where: { id: adviserId },
    data: adviser,
  });
}

export async function deleteOneAdviserByAdviserId(adviserId: number) {
  const deletedAdviser = await deleteUniqueAdviser({
    where: { id: adviserId },
  });
  return deletedAdviser;
}

export async function addAdviserRoleToManyUsers(body: any) {
  const { count, nusnetIds } = body;
  if (count != nusnetIds.length) {
    throw new SkylabError(
      "Count does not match length of nusnetIds array",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const currentCohortYear = await (await getCurrentCohort()).academicYear;
  const advisers = await Promise.all(
    nusnetIds.map(async (nusnetId: string) => {
      const student = await getOneStudentByNusnetId(nusnetId);
      const createdAdviser = await addAdviserRoleToUser(student.userId, {
        adviser: {
          nusnetId: nusnetId,
          cohortYear: currentCohortYear,
        },
      });
      return createdAdviser;
    })
  );
  return advisers;
}
