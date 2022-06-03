import { User, Mentor } from "@prisma/client";
import { getAllMentors, getMentorByEmail } from "src/models/mentors.db";

export const parseMentorGetInput = (
  rawGetInfo: User & { mentor?: Mentor | null }
) => {
  const mentor = rawGetInfo.mentor;
  delete rawGetInfo["mentor"];
  return { ...rawGetInfo, ...mentor };
};

export const getMentorByEmailParsed = async (email: string) => {
  const mentorByEmail = await getMentorByEmail(email);
  return parseMentorGetInput(mentorByEmail);
};

export const getAllMentorsParsed = async () => {
  const allMentors = await getAllMentors();
  const allMentorsParsed = allMentors.map((mentor) => {
    return parseMentorGetInput(mentor);
  });
  return allMentorsParsed;
};
