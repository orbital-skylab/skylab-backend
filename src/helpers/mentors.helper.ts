/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import { getManyMentors, getOneMentor } from "src/models/mentors.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

/**
 * @function getMentorInputParser Parse the input returned from the prisma.mentor.find function
 * @param mentor The payload returned from prisma.mentor.find
 * @returns Flattened object with both User and Mentor Data
 */
export const getMentorInputParser = (
  mentor: Prisma.MentorGetPayload<{ include: { user: true } }>
) => {
  const { user, id, ...data } = mentor;
  return { ...user, ...data, mentorId: id };
};

export const getMentorById = async (mentorId: string) => {
  const mentor = await getOneMentor({ where: { id: Number(mentorId) } });
  return getMentorInputParser(mentor);
};

/**
 * @function getMentorsFilterParser Parse the query from the HTTP Request and returns a query object
 * for prisma.mentor.findMany
 * @param query The raw query object from the HTTP Request
 * @returns A filter object that works with prisma.mentor.findMany
 */
export const getMentorsFilterParser = (query: any) => {
  let filter: Prisma.MentorFindManyArgs = {};

  if ((query.page && !query.limit) || (query.limit && !query.page)) {
    throw new SkylabError(
      `${
        query.limit ? "Page" : "Limit"
      } parameter missing in a pagination query`,
      HttpStatusCode.BAD_REQUEST
    );
  }

  if (query.page && query.limit) {
    filter = {
      ...filter,
      take: Number(query.limit),
      skip: Number(query.page) * Number(query.limit),
    };
  }

  if (query.cohortYear) {
    filter = { ...filter, where: { cohortYear: Number(query.cohortYear) } };
  }

  return filter;
};

/**
 * @function getFilteredMentors Retrieve a list of mentors that match the given query parameters
 * @param query The query parameters retrieved from the HTTP Request
 * @returns Array of Mentor Records that match the given query
 */
export const getFilteredMentors = async (query: any) => {
  const filteredQuery = getMentorsFilterParser(query);
  const mentors = await getManyMentors(filteredQuery);
  const parsedMentors = mentors.map((mentor) => getMentorInputParser(mentor));
  return parsedMentors;
};
