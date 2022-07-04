import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import {
  deleteUniqueUser,
  findManyUsersWithRoleInCohort,
  findUniqueUser,
  updateUniqueUser,
} from "src/models/users.db";
import { Prisma, User } from "@prisma/client";
import { UserRolesEnum } from "src/validators/user.validator";

export function removePasswordFromUser(user: User) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
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
  const userQuery: Prisma.UserFindManyArgs = {
    take: limit ?? undefined,
    skip: limit && page ? limit * page : undefined,
    where: {
      name: search
        ? { contains: query.search, mode: "insensitive" }
        : undefined,
      mentor:
        role == UserRolesEnum.Mentor
          ? { some: { cohortYear: cohortYear } }
          : undefined,
      student:
        role == UserRolesEnum.Student
          ? { some: { cohortYear: cohortYear } }
          : undefined,
      adviser:
        role == UserRolesEnum.Adviser
          ? { some: { cohortYear: cohortYear } }
          : undefined,
      administrator:
        role == UserRolesEnum.Administrator
          ? { some: { endDate: { gte: new Date() } } }
          : undefined,
    },
  };

  /* Fetch Users with Filter Object */
  const users = await findManyUsersWithRoleInCohort(userQuery, cohortYear);

  /* Parse Users Objects */
  const parsedUsers = users.map((user) => {
    const { student, mentor, administrator, adviser, ...userInfo } = user;
    const userInfoWithoutPassword = removePasswordFromUser(userInfo);
    return {
      ...userInfoWithoutPassword,
      student: student[0] ?? {},
      mentor: mentor[0] ?? {},
      adviser: adviser[0] ?? {},
      administrator: administrator[0] ?? {},
    };
  });

  return parsedUsers;
}

export async function getOneUserById(userId: number) {
  try {
    return removePasswordFromUser(
      await findUniqueUser({ where: { id: userId } })
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
