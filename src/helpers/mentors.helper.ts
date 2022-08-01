/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, User } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneMentor,
  deleteUniqueMentor,
  findManyMentorsWithUserData,
  findUniqueMentorWithUserData,
  updateUniqueMentor,
} from "src/models/mentors.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { generateRandomPassword, hashPassword } from "./authentication.helper";
import { isValidEmail, removePasswordFromUser } from "./users.helper";
import { prismaMinimal as prisma } from "../client";

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

  const { cohortYear, projectIds, ...mentorData } = mentor;

  const [createdUser, createdMentor] = await prisma.$transaction([
    prisma.user.create({ data: user }),
    prisma.mentor.create({
      data: {
        ...mentorData,
        user: { connect: { email: user.email } },
        cohort: { connect: { academicYear: cohortYear } },
        projects: projectIds
          ? {
              connect: projectIds.map((projectId: any) => {
                return { id: Number(projectId) };
              }),
            }
          : undefined,
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
  const { count, mentors } = body;

  if (count != mentors.length) {
    throw new SkylabError(
      "Count and Projects Data do not match",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const accountsWithHashedPasswords = await Promise.all(
    (
      mentors as {
        user: User;
        mentor: Prisma.MentorCreateInput & { cohortYear: number };
      }[]
    ).map(async (account) => {
      const { user, mentor } = account;
      return {
        user: {
          ...user,
          password:
            isDev && user.password
              ? await hashPassword(user.password)
              : await generateRandomPassword(),
        },
        mentor,
      };
    })
  );

  const createAccountAttempts = await Promise.allSettled(
    accountsWithHashedPasswords.map(async (account) => {
      const { user, mentor } = account;

      if (!isValidEmail(user.email)) {
        throw new SkylabError("Email is invalid", HttpStatusCode.BAD_REQUEST);
      }

      const { cohortYear, ...mentorData } = mentor;
      const [createdUser, createdMentor] = await prisma.$transaction([
        prisma.user.create({
          data: { ...user },
        }),
        prisma.mentor.create({
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
    })
  );

  return createAccountAttempts
    .map((attempt, index) => {
      if (attempt.status === "rejected") {
        return `- Row ${index + 1}: ${attempt.reason.message}`;
      }
    })
    .filter((error) => error)
    .join("\n");
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

export async function editMentorDataByMentorID(mentorId: number, body: any) {
  const { mentor } = body;
  return await updateUniqueMentor({
    where: { id: mentorId },
    data: mentor,
  });
}

export async function deleteOneMentorByMentorID(mentorId: number) {
  const deletedMentor = await deleteUniqueMentor({ where: { id: mentorId } });
  return deletedMentor;
}
