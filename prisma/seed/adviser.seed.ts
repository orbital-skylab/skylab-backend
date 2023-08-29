import { faker } from "@faker-js/faker";
import { type PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

export const seedAdvisers = async (prisma: PrismaClient) => {
  const academicYear = new Date().getFullYear();
  const password = await bcrypt.hash(
    process.env.ADMIN_PASSWORD as string,
    parseInt(process.env.SALT_ROUNDS as string)
  );

  for (let i = 1; i <= 100; i++) {
    const userFirstName = faker.name.firstName();
    const userLastName = faker.name.lastName();
    await prisma.adviser.create({
      data: {
        matricNo: faker.helpers.replaceSymbols("A0######?"),
        nusnetId: faker.helpers.replaceSymbols("e#######"),
        cohort: {
          connect: {
            academicYear: academicYear,
          },
        },
        user: {
          create: {
            name: i === 1 ? "Adviser" : `${userFirstName} ${userLastName}`,
            password,
            email:
              i === 1
                ? "adviser@skylab.com"
                : faker.internet.email(userFirstName, userLastName),
            profilePicUrl: faker.image.imageUrl(),
            githubUrl: faker.internet.url(),
            linkedinUrl: faker.internet.url(),
            personalSiteUrl: faker.internet.url(),
            selfIntro: faker.lorem.sentence(),
          },
        },
        projects: {
          connect: { id: i },
        },
      },
    });
  }

  for (let i = 1; i <= 100; i++) {
    await prisma.project.update({
      where: {
        id: i,
      },
      data: {
        adviser: {
          connect: {
            id: i,
          },
        },
      },
    });
  }
};
