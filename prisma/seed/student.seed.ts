import { faker } from "@faker-js/faker";
import { AchievementLevel, type PrismaClient } from "@prisma/client";

export const seedStudents = async (prisma: PrismaClient) => {
  const academicYear = new Date().getFullYear();

  for (let i = 0; i < 200; i++) {
    const userFirstName = faker.name.firstName();
    const userLastName = faker.name.lastName();
    await prisma.student.create({
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
            name: `${userFirstName} ${userLastName}`,
            password: process.env.ADMIN_PASSWORD as string,
            email: faker.internet.email(userFirstName, userLastName),
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

  for (let i = 1; i <= 100; i++) {
    await prisma.project.create({
      data: {
        name: `${faker.word.adjective()} ${faker.word.noun()}`,
        teamName: `Team ${faker.word.adjective()} ${faker.word.noun()}`,
        achievement: faker.helpers.arrayElement(
          Object.values(AchievementLevel)
        ),
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
            { id: 201 - i },
          ],
        },
      },
    });
  }

  console.log("seeded students and projects");
};
