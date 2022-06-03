import { User, Mentor } from "@prisma/client";
import { getAllMentors, getMentorByEmail } from "src/models/mentors.db";

export interface IGetMentor {
  Mentor?: Mentor | null;
}

export const parseGetInput = (rawGetInfo: User & IGetMentor) => {
  const mentor = rawGetInfo.Mentor;
  delete rawGetInfo["Mentor"];
  return { ...rawGetInfo, ...mentor };
};

export const getMentorByEmailParsed = async (email: string) => {
  const mentorByEmail = await getMentorByEmail(email);
  return parseGetInput(mentorByEmail);
};

export const getAllMentorsParsed = async () => {
  const allMentors = await getAllMentors();
  const allMentorsParsed = allMentors.map((mentor) => {
    return parseGetInput(mentor);
  });
  return allMentorsParsed;
};
