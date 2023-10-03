import { faker } from "@faker-js/faker";
import { type PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

export const seedAdvisers = async (prisma: PrismaClient) => {
  const academicYear = new Date().getFullYear();
  const password = await bcrypt.hash(
    process.env.ADMIN_PASSWORD as string,
    parseInt(process.env.SALT_ROUNDS as string)
  );

  const matricNos = new Set<string>();
  const nusnetIds = new Set<string>();

  for (let i = 1; i <= 100; i++) {
    const userFirstName = faker.name.firstName();
    const userLastName = faker.name.lastName();

    let userMatricNo = faker.helpers.replaceSymbols("A0######?");
    while (matricNos.has(userMatricNo)) {
      userMatricNo = faker.helpers.replaceSymbols("A0######?");
    }
    let userNusnetId = faker.helpers.replaceSymbols("e0######");
    while (nusnetIds.has(userNusnetId)) {
      userNusnetId = faker.helpers.replaceSymbols("e0######");
    }

    await prisma.adviser.create({
      data: {
        matricNo: userMatricNo,
        nusnetId: userNusnetId,
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
                : faker.internet.email(userFirstName, userLastName + `${i}`),
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

  for (let i = 1; i <= 200; i++) {
    await prisma.project.update({
      where: {
        id: i,
      },
      data: {
        adviser: {
          connect: {
            id: i > 100 ? i - 100 : i,
          },
        },
      },
    });
  }
};
