import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { prisma } from "../client";

/**
 * @function getOneAnnouncement Find the announcement that matches the given unique query conditions
 * @param query The unique query conditions to retrieve the announcement by
 * @returns The unique announcement that matches the given query conditions
 */
export const getOneAnnouncement = async (
  query: Prisma.AnnouncementFindUniqueArgs
) => {
  const announcement = await prisma.announcement.findUnique({
    ...query,
    rejectOnNotFound: false,
  });

  if (!announcement) {
    throw new SkylabError(
      "Announcement was not found",
      HttpStatusCode.BAD_REQUEST
    );
  }

  return announcement;
};

/**
 * @function getOneAnnouncementWithComments Find the announcement including comments that matches the given unique query conditions
 * @param announcementId The announcement id
 * @returns The unique announcement with comments that matches the given id
 */
export const getOneAnnouncementWithComments = async ({
  announcementId,
}: {
  announcementId;
}) => {
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
      announcementComments: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    rejectOnNotFound: false,
  });

  if (!announcement) {
    throw new SkylabError(
      "Announcement was not found",
      HttpStatusCode.BAD_REQUEST
    );
  }

  return announcement;
};

/**
 * @function getManyAnnouncements Find the announcements that match the given query conditions
 * @param query The query conditions to retrieve the announcements by
 * @returns An array of announcement records that match the given query conditions
 */
export const getManyAnnouncements = async (
  query: Prisma.AnnouncementFindManyArgs
) => {
  const cohorts = await prisma.announcement.findMany(query);
  return cohorts;
};

/**
 * @function createOneAnnouncement Create a new announcement
 * @param cohort Information of the announcement to be created
 * @returns Announcement object created in the database
 */
export const createOneAnnouncement = async (
  query: Prisma.AnnouncementCreateArgs
) => {
  try {
    const newAnnouncement = await prisma.announcement.create(query);
    return newAnnouncement;
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw e;
    }

    throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST);
  }
};

// export const editCohort = async (query: Prisma.CohortUpdateArgs) => {
//   try {
//     return await prisma.cohort.update(query);
//   } catch (e) {
//     if (!(e instanceof PrismaClientKnownRequestError)) {
//       throw e;
//     }

//     throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
//   }
// };

// export const deleteCohort = async (query: Prisma.CohortDeleteArgs) => {
//   try {
//     return await prisma.cohort.delete(query);
//   } catch (e) {
//     if (!(e instanceof PrismaClientKnownRequestError)) {
//       throw e;
//     }
//     throw new SkylabError(e.message, HttpStatusCode.BAD_REQUEST, e.meta);
//   }
// };
