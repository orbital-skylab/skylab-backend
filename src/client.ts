import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const prismaMinimal = new PrismaClient({
  errorFormat: "minimal",
});
