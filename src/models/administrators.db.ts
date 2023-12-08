import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { prisma } from "../client";

export async function findFirstAdministrator({
  include,
  ...query
}: Prisma.AdministratorFindFirstArgs) {
  const firstAdministrator = await prisma.administrator.findFirst({
    ...query,
    include: { ...include, user: true },
    rejectOnNotFound: false,
  });
  if (!firstAdministrator) {
    throw new SkylabError(
      "Administrator was not found",
      HttpStatusCode.BAD_REQUEST
    );
  }
  return firstAdministrator;
}

export async function findUniqueAdministrator(
  query: Prisma.AdministratorFindUniqueArgs
) {
  const uniqueAdministrator = await prisma.administrator.findUnique({
    ...query,
    rejectOnNotFound: false,
  });
  if (!uniqueAdministrator) {
    throw new SkylabError(
      "Administrator was not found",
      HttpStatusCode.BAD_REQUEST
    );
  }
  return uniqueAdministrator;
}

export async function findUniqueAdministratorWithUserData({
  include,
  ...query
}: Prisma.AdministratorFindUniqueArgs) {
  const uniqueAdministrator = await prisma.administrator.findUnique({
    include: { ...include, user: true },
    ...query,
    rejectOnNotFound: false,
  });
  if (!uniqueAdministrator) {
    throw new SkylabError(
      "Administrator was not found",
      HttpStatusCode.BAD_REQUEST
    );
  }
  return uniqueAdministrator;
}

export async function findManyAdministratorsWithUserData({
  include,
  ...query
}: Prisma.AdministratorFindManyArgs) {
  const manyAdministrators = await prisma.administrator.findMany({
    include: { ...include, user: true },
    ...query,
  });
  return manyAdministrators;
}

export async function createOneAdministrator(
  administrator: Prisma.AdministratorCreateArgs
) {
  try {
    return await prisma.administrator.create(administrator);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "Administrator is not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
}

export async function createManyAdministrators(
  administrators: Prisma.AdministratorCreateManyArgs
) {
  try {
    return await prisma.administrator.createMany(administrators);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "One of the administrators are not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }
  }
}

export async function updateUniqueAdministrator(
  query: Prisma.AdministratorUpdateArgs
) {
  try {
    return await prisma.administrator.update(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    } else {
      throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}

export async function deleteUniqueAdministrator(
  query: Prisma.AdministratorDeleteArgs
) {
  try {
    return await prisma.administrator.delete(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    } else {
      throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}
