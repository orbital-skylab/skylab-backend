import { User, Adviser, PrismaClient, Prisma } from "@prisma/client";
import { getAllAdvisers, getOneAdviser } from "src/models/advisers.db";

export const parseAdviserGetInput = (
  rawGetInfo: User & { adviser?: Adviser | null }
) => {
  const adviser = rawGetInfo.adviser;

  delete rawGetInfo["adviser"];

  return { ...rawGetInfo, ...adviser };
};

export const getAdviserByEmailParsed = async (email: string) => {
  const adviserByEmail = await getAdviserByEmail(email);
  return parseAdviserGetInput(adviserByEmail);
};

export const getAllAdvisersParsed = async () => {
  const allAdvisers = await getAllAdvisers();
  const allAdvisersParsed = allAdvisers.map((adviser) => {
    return parseAdviserGetInput(adviser);
  });
  return allAdvisersParsed;
};

export const getAdviserByEmail = async (email: string) => {};
