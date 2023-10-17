import { faker } from "@faker-js/faker";
import { type PrismaClient } from "@prisma/client";
import {
  generateNUniqueRandomStrings,
  generateHashedPassword,
} from "./seed.util";
import { NUM_ADVISERS, NUM_TEAMS } from "./seed.constants";

export const seedAdvisers = async (prisma: PrismaClient) => {
  const academicYear = new Date().getFullYear();
  const password = await generateHashedPassword();

  const userMatricNos = generateNUniqueRandomStrings(NUM_ADVISERS, () =>
    faker.helpers.replaceSymbols("A0######?")
  );
  const userNusnetIds = generateNUniqueRandomStrings(NUM_ADVISERS, () =>
    faker.helpers.replaceSymbols("e0######")
  );

  for (let i = 1; i <= NUM_ADVISERS; i++) {
    const userFirstName = faker.name.firstName();
    const userLastName = faker.name.lastName();

    await prisma.adviser.create({
      data: {
        matricNo: userMatricNos[i - 1],
        nusnetId: userNusnetIds[i - 1],
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

  for (let i = 1; i <= NUM_TEAMS; i++) {
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
