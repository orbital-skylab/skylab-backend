import { faker } from "@faker-js/faker";
import { AchievementLevel, type PrismaClient } from "@prisma/client";
import {
  generateHashedPassword,
  generateNUniqueRandomStrings,
} from "./seed.util";
import { NUM_STUDENTS, NUM_TEAMS } from "./seed.constants";

export const seedStudents = async (prisma: PrismaClient) => {
  const academicYear = new Date().getFullYear();
  const password = await generateHashedPassword();

  const userMatricNos = generateNUniqueRandomStrings(NUM_STUDENTS, () =>
    faker.helpers.replaceSymbols("A0######?")
  );
  const userNusnetIds = generateNUniqueRandomStrings(NUM_STUDENTS, () =>
    faker.helpers.replaceSymbols("e0######")
  );

  for (let i = 0; i < NUM_STUDENTS; i++) {
    const userFirstName = faker.name.firstName();
    const userLastName = faker.name.lastName();

    const name = i === 0 ? "Student" : `${userFirstName} ${userLastName}`;
    const email = i === 0 ? "student@skylab.com" : `student${i}@skylab.com`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        password,
        profilePicUrl: faker.image.imageUrl(),
        githubUrl: faker.internet.url(),
        linkedinUrl: faker.internet.url(),
        personalSiteUrl: faker.internet.url(),
        selfIntro: faker.lorem.sentence(),
      },
      create: {
        name,
        password,
        email,
        profilePicUrl: faker.image.imageUrl(),
        githubUrl: faker.internet.url(),
        linkedinUrl: faker.internet.url(),
        personalSiteUrl: faker.internet.url(),
        selfIntro: faker.lorem.sentence(),
      },
    });

    await prisma.student.upsert({
      where: {
        userId_cohortYear: {
          userId: user.id,
          cohortYear: academicYear,
        },
      },
      update: {
        matricNo: userMatricNos[i],
        nusnetId: userNusnetIds[i],
      },
      create: {
        matricNo: userMatricNos[i],
        nusnetId: userNusnetIds[i],
        cohort: {
          connect: {
            academicYear,
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });
  }

  const projectTeamNames = generateNUniqueRandomStrings(
    NUM_TEAMS,
    () => `Team ${faker.word.adjective()} ${faker.word.noun()}`
  );

  for (let i = 1; i <= NUM_TEAMS; i++) {
    await prisma.project.create({
      data: {
        name: `${faker.word.adjective()} ${faker.word.noun()}`,
        teamName: projectTeamNames[i - 1],
        achievement: faker.helpers.arrayElement(
          Object.values(AchievementLevel)
        ),
        posterUrl: faker.image.imageUrl(),
        proposalPdf: faker.internet.url(),
        cohort: {
          connect: {
            academicYear,
          },
        },
        students: {
          connect: [{ id: i }, { id: 401 - i }],
        },
      },
    });
  }
};
