import { User, Adviser } from "@prisma/client";
import { getAllAdvisers, getAdviserByEmail } from "src/models/advisers.db";

export const parseGetInput = (
  rawGetInfo: User & { Adviser?: Adviser | null }
) => {
  const adviser = rawGetInfo.Adviser;

  delete rawGetInfo["Adviser"];

  return { ...rawGetInfo, ...adviser };
};

export const getAdviserByEmailParsed = async (email: string) => {
  const adviserByEmail = await getAdviserByEmail(email);
  return parseGetInput(adviserByEmail);
};

export const getAllAdvisersParsed = async () => {
  const allAdvisers = await getAllAdvisers();
  const allAdvisersParsed = allAdvisers.map((adviser) => {
    return parseGetInput(adviser);
  });
  return allAdvisersParsed;
};
