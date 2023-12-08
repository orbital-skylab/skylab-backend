import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { prisma } from "../client";

export async function findFirstAdviser({
  include,
  ...query
}: Prisma.AdviserFindFirstArgs) {
  const firstAdviser = await prisma.adviser.findFirst({
    ...query,
    include: { ...include, user: true },
    rejectOnNotFound: false,
  });
  if (!firstAdviser) {
    throw new SkylabError("Adviser was not found", HttpStatusCode.BAD_REQUEST);
  }
  return firstAdviser;
}

export async function findUniqueAdviser(query: Prisma.AdviserFindUniqueArgs) {
  const uniqueAdviser = await prisma.adviser.findUnique({
    ...query,
    rejectOnNotFound: false,
  });
  if (!uniqueAdviser) {
    throw new SkylabError("Adviser was not found", HttpStatusCode.BAD_REQUEST);
  }
  return uniqueAdviser;
}

export async function findUniqueAdviserWithUserData({
  include,
  ...query
}: Prisma.AdviserFindUniqueArgs) {
  const uniqueAdviser = await prisma.adviser.findUnique({
    include: { ...include, user: true },
    ...query,
    rejectOnNotFound: false,
  });
  if (!uniqueAdviser) {
    throw new SkylabError("Adviser was not found", HttpStatusCode.BAD_REQUEST);
  }
  return uniqueAdviser;
}

export async function findUniqueAdviserWithProjectData({
  include,
  ...query
}: Prisma.AdviserFindUniqueArgs) {
  const uniqueAdviser = await prisma.adviser.findUnique({
    include: { ...include, projects: true },
    ...query,
    rejectOnNotFound: false,
  });
  if (!uniqueAdviser) {
    throw new SkylabError("Adviser was not found", HttpStatusCode.BAD_REQUEST);
  }
  return uniqueAdviser;
}

export async function findManyAdvisersWithUserData({
  include,
  ...query
}: Prisma.AdviserFindManyArgs) {
  const manyAdvisers = await prisma.adviser.findMany({
    include: { ...include, user: true },
    ...query,
  });
  return manyAdvisers;
}

export async function createOneAdviser(adviser: Prisma.AdviserCreateArgs) {
  try {
    return await prisma.adviser.create(adviser);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "Adviser is not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
}

export async function createManyAdvisers(
  advisers: Prisma.AdviserCreateManyArgs
) {
  try {
    return await prisma.adviser.createMany(advisers);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "One of the advisers are not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }
  }
}

export async function updateUniqueAdviser(query: Prisma.AdviserUpdateArgs) {
  try {
    return await prisma.adviser.update(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    } else {
      throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}

export async function deleteUniqueAdviser(query: Prisma.AdviserDeleteArgs) {
  try {
    return await prisma.adviser.delete(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    } else {
      throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}

export async function countAdvisers(query: Prisma.AdviserCountArgs) {
  try {
    return await prisma.adviser.count(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    } else {
      throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}
