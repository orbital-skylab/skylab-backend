import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "../errors/SkylabError";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { prisma } from "../client";

export async function findFirstMentor({
  include,
  ...query
}: Prisma.MentorFindFirstArgs) {
  const firstMentor = await prisma.mentor.findFirst({
    ...query,
    include: { ...include, user: true },
    rejectOnNotFound: false,
  });
  if (!firstMentor) {
    throw new SkylabError("Mentor was not found", HttpStatusCode.BAD_REQUEST);
  }
  return firstMentor;
}

export async function findUniqueMentor(query: Prisma.MentorFindUniqueArgs) {
  const uniqueMentor = await prisma.mentor.findUnique({
    ...query,
    rejectOnNotFound: false,
  });
  if (!uniqueMentor) {
    throw new SkylabError("Mentor was not found", HttpStatusCode.BAD_REQUEST);
  }
  return uniqueMentor;
}

export async function findUniqueMentorWithProjectData({
  include,
  ...query
}: Prisma.MentorFindUniqueArgs) {
  const uniqueMentor = await prisma.mentor.findUnique({
    ...query,
    include: { ...include, projects: true },
    rejectOnNotFound: false,
  });
  if (!uniqueMentor) {
    throw new SkylabError("Mentor was not found", HttpStatusCode.BAD_REQUEST);
  }
  return uniqueMentor;
}

export async function findUniqueMentorWithUserData({
  include,
  ...query
}: Prisma.MentorFindUniqueArgs) {
  const uniqueMentor = await prisma.mentor.findUnique({
    include: { ...include, user: true },
    ...query,
    rejectOnNotFound: false,
  });
  if (!uniqueMentor) {
    throw new SkylabError("Mentor was not found", HttpStatusCode.BAD_REQUEST);
  }
  return uniqueMentor;
}

export async function findManyMentorsWithUserData({
  include,
  ...query
}: Prisma.MentorFindManyArgs) {
  const manyMentors = await prisma.mentor.findMany({
    include: { ...include, user: true },
    ...query,
  });
  return manyMentors;
}

export async function createOneMentor(mentor: Prisma.MentorCreateArgs) {
  try {
    return await prisma.mentor.create(mentor);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "Mentor is not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
  }
}

export async function createManyMentors(mentors: Prisma.MentorCreateManyArgs) {
  try {
    return await prisma.mentor.createMany(mentors);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    if (e.code === "P2002") {
      throw new SkylabError(
        "One of the mentors are not unique",
        HttpStatusCode.BAD_REQUEST,
        e.meta
      );
    }
  }
}

export async function updateUniqueMentor(query: Prisma.MentorUpdateArgs) {
  try {
    return await prisma.mentor.update(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    } else {
      throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}

export async function deleteUniqueMentor(query: Prisma.MentorDeleteArgs) {
  try {
    return await prisma.mentor.delete(query);
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    } else {
      throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
    }
  }
}

export async function countMentors(query: Prisma.MentorCountArgs) {
  try {
    const count = await prisma.mentor.count(query);
    return count;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
}
