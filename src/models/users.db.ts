import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export interface IUser {
  nusnetId: string | null | undefined;
  matricNo: string | null | undefined;
  name: string;
  email: string;
  profilePicUrl: string | null | undefined;
  githubUrl: string | null | undefined;
  linkedinUrl: string | null | undefined;
  personalSiteUrl: string | null | undefined;
  selfIntro: string | null | undefined;
}

export const createUser = async (
  userToCreate: Prisma.UserCreateInput | IUser
) => {
  const createUser = await prisma.user.create({ data: userToCreate });
  return createUser;
};

export const getAllUsers = async () => {
  const allUsers = await prisma.user.findMany();
  return allUsers;
};
