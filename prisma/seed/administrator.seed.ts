import { type PrismaClient } from "@prisma/client";
import { generateHashedPassword } from "./seed.util";

export const seedAdmin = async (prisma: PrismaClient) => {
  const today = new Date();
  const yesterday = new Date();
  const nextYear = new Date();
  yesterday.setDate(today.getDate() - 1);
  nextYear.setFullYear(today.getFullYear() + 1);
  const password = await generateHashedPassword();

  await prisma.administrator.create({
    data: {
      startDate: yesterday,
      endDate: nextYear,
      user: {
        create: {
          name: "Admin",
          email: "admin@skylab.com",
          password,
        },
      },
    },
  });
};
