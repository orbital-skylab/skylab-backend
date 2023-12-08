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

    await prisma.student.create({
      data: {
        matricNo: userMatricNos[i],
        nusnetId: userNusnetIds[i],
        cohort: {
          connect: {
            academicYear: academicYear,
          },
        },
        user: {
          create: {
            name: i === 0 ? "Student" : `${userFirstName} ${userLastName}`,
            password,
            email:
              i === 0
                ? "student@skylab.com"
                : faker.internet.email(userFirstName, userLastName + `${i}`),
            profilePicUrl: faker.image.imageUrl(),
            githubUrl: faker.internet.url(),
            linkedinUrl: faker.internet.url(),
            personalSiteUrl: faker.internet.url(),
            selfIntro: faker.lorem.sentence(),
          },
        },
      },
    });
  }

  const projectTeamNames = generateNUniqueRandomStrings(
    NUM_TEAMS,
    () => `Team ${faker.word.adjective()} ${faker.word.noun()}`
  );

  // there will be 2 teamless students
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
            academicYear: academicYear,
          },
        },
        students: {
          connect: [
            {
              id: i,
            },
            { id: 401 - i },
          ],
        },
      },
    });
  }
};
