import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { SkylabError } from "src/errors/SkylabError";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";
import { prisma } from "../client";

// /**
//  * @function getOneCohort Find the cohort that matches the given unique query conditions
//  * @param query The unique query conditions to retrieve the cohort by
//  * @returns The unique cohort that matches the given query conditions
//  */
// export const getOneCohort = async (query: Prisma.CohortFindUniqueArgs) => {
//   const cohort = await prisma.cohort.findUnique({
//     ...query,
//     rejectOnNotFound: false,
//   });

//   if (!cohort) {
//     throw new SkylabError("Cohort was not found", HttpStatusCode.BAD_REQUEST);
//   }

//   return cohort;
// };

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