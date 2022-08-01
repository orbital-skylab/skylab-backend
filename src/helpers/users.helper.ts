import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import {
  deleteUniqueUser,
  findManyUsers,
  findUniqueUserWithRoleData,
  updateUniqueUser,
} from "src/models/users.db";
import {
  Administrator,
  Adviser,
  Mentor,
  Prisma,
  Student,
  User,
} from "@prisma/client";
import { UserRolesEnum } from "src/validators/user.validator";
import { getOneCohort } from "src/models/cohorts.db";

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
