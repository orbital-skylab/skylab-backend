import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import {
  deleteUniqueUser,
  findManyUsers,
  findUniqueUserWithRoleData,
  updateUniqueUser,
} from "../models/users.db";
import {
  Administrator,
  Adviser,
  Mentor,
  Prisma,
  Student,
  User,
} from "@prisma/client";
import { UserRolesEnum } from "../validators/user.validator";
import { getOneCohort } from "../models/cohorts.db";
import { findFirstStudentWithoutError } from "../models/students.db";

export function removePasswordFromUser(user: User) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getUsersFilterRoleInputParser(
  role: UserRolesEnum,
  cohortYear: number
): Promise<{
  where: Prisma.UserWhereInput;
  include: Prisma.UserInclude;
}> {
  const cohort = cohortYear
    ? await getOneCohort({ where: { academicYear: cohortYear } })
    : undefined;
  const startDate = cohort ? cohort.startDate : undefined;
  const endDate = cohort ? cohort.endDate : undefined;
  if (role && cohort) {
    return {
      where: { [role]: { some: { cohortYear: cohortYear } } },
      include: { [role]: true },
    };
  } else if (!role && cohort) {
    return {
      where: {
        OR: [
          { student: { some: { cohortYear: cohortYear } } },
          { mentor: { some: { cohortYear: cohortYear } } },
          { adviser: { some: { cohortYear: cohortYear } } },
          {
            administrator: {
              some: {
                OR: [
                  { endDate: { gte: startDate, lte: endDate } },
                  { startDate: { gte: startDate, lte: endDate } },
                ],
              },
            },
          },
        ],
      },
      include: {
        student: true,
        mentor: true,
        administrator: true,
        adviser: true,
      },
    };
  } else if (role && !cohort) {
    return {
      where: {
        [role]: { some: {} },
      },
      include: { [role]: true },
    };
  } else {
    return {
      where: {},
      include: {
        student: true,
        mentor: true,
        administrator: true,
        adviser: true,
      },
    };
  }
}

export async function getManyUsersWithFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any & {
    role?: string;
    limit?: number;
    page?: number;
    cohortYear: number;
    search?: string;
  }
) {
  const { role, limit, page, cohortYear, search } = query;
  /* Create Filter Object */
  let userQuery: Prisma.UserFindManyArgs = {
    take: limit ?? undefined,
    skip: limit && page ? limit * page : undefined,
    where: {
      name: search
        ? { contains: query.search, mode: "insensitive" }
        : undefined,
    },
  };

  const roleCohortQuery = await getUsersFilterRoleInputParser(role, cohortYear);

  userQuery = {
    ...userQuery,
    include: roleCohortQuery.include,
    where: {
      ...userQuery.where,
      ...roleCohortQuery.where,
    },
  };

  const users: (User & {
    student?: Student[];
    mentor?: Mentor[];
    administrator?: Administrator[];
    adviser?: Adviser[];
  })[] = await findManyUsers(userQuery);

  /* Parse Users Objects */
  const parsedUsers = users.map((user) => {
    const { student, mentor, administrator, adviser, ...userInfo } = user;
    const userInfoWithoutPassword = removePasswordFromUser(userInfo);
    return {
      ...userInfoWithoutPassword,
      student: student ? student[0] ?? {} : {},
      mentor: mentor ? mentor[0] ?? {} : {},
      adviser: adviser ? adviser[0] ?? {} : undefined,
      administrator: administrator ? administrator[0] ?? {} : undefined,
    };
  });

  return parsedUsers;
}

export async function getOneUserById(userId: number) {
  try {
    return removePasswordFromUser(
      await findUniqueUserWithRoleData({ where: { id: userId } })
    );
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      throw new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
    throw e;
  }
}

export async function editOneUserById(
  id: number,
  data: Prisma.UserUpdateInput
) {
  try {
    return removePasswordFromUser(
      await updateUniqueUser({ where: { id: id }, data: data })
    );
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      throw new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    } else {
      throw e;
    }
  }
}

export async function deleteOneUserById(id: number) {
  try {
    return removePasswordFromUser(
      await deleteUniqueUser({ where: { id: id } })
    );
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      throw new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    } else {
      throw e;
    }
  }
}

export async function addRoleToUsers(
  role: string,
  cohortYear: number,
  userIds: number[]
) {
  const pAddedRoles = userIds.map(async (userId) => {
    if (role == UserRolesEnum.Student) {
      const student = await updateUniqueUser({
        where: { id: userId },
        data: { student: { create: { cohortYear: cohortYear } } },
      });
      return student;
    } else if (role == UserRolesEnum.Adviser) {
      const student = await findFirstStudentWithoutError({
        where: { userId: userId },
      });
      const adviser = await updateUniqueUser({
        where: { id: userId },
        data: {
          adviser: {
            create: {
              cohortYear: cohortYear,
              nusnetId: student ? student.nusnetId : undefined,
              matricNo: student ? student.matricNo : undefined,
            },
          },
        },
      });
      return adviser;
    } else if (role == UserRolesEnum.Administrator) {
      const targetCohort = await getOneCohort({
        where: { academicYear: cohortYear },
      });
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      const admin = await updateUniqueUser({
        where: { id: userId },
        data: {
          administrator: {
            create: {
              startDate: new Date(),
              endDate: targetCohort?.endDate ?? nextYear,
            },
          },
        },
      });
      return admin;
    } else {
      const mentor = await updateUniqueUser({
        where: { id: userId },
        data: { mentor: { create: { cohortYear: cohortYear } } },
      });
      return mentor;
    }
  });
  return await Promise.all(pAddedRoles);
}
export const isValidEmail = (email: string) => {
  const emailPattern =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailPattern.test(email);
};

export const isValidMatriculationNumber = (
  matricNo: string | null | undefined
) => {
  if (matricNo == null || matricNo == undefined) {
    return false;
  }

  const matricNoPattern = /^(a|A)[0-9]{7}[A-Za-z]$/;
  return matricNoPattern.test(matricNo);
};

export const isValidNusnetId = (nusnetId: string | null | undefined) => {
  if (nusnetId == null || nusnetId == undefined) {
    return false;
  }

  const nusnetIdPattern = /^(e|E)[0-9]{7}$/;
  return nusnetIdPattern.test(nusnetId);
};
