import { type PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

export const seedAdmin = async (prisma: PrismaClient) => {
  const today = new Date();
  const yesterday = new Date();
  const nextYear = new Date();
  yesterday.setDate(today.getDate() - 1);
  nextYear.setFullYear(today.getFullYear() + 1);
  const password = await bcrypt.hash(
    process.env.ADMIN_PASSWORD as string,
    parseInt(process.env.SALT_ROUNDS as string)
  );

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
