import { faker } from "@faker-js/faker";
import { AchievementLevel, type PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

export const seedStudents = async (prisma: PrismaClient) => {
  const academicYear = new Date().getFullYear();
  const password = await bcrypt.hash(
    process.env.ADMIN_PASSWORD as string,
    parseInt(process.env.SALT_ROUNDS as string)
  );

  const matricNos = new Set<string>();
  const nusnetIds = new Set<string>();

  for (let i = 0; i < 200; i++) {
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

    await prisma.student.create({
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
            name: i === 0 ? "Student" : `${userFirstName} ${userLastName}`,
            password,
            email:
              i === 0
                ? "student@skylab.com"
                : faker.internet.email(
                    userFirstName,
                    userLastName + `${i}`,
                    "skylab.com"
                  ),
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
            { id: 201 - i },
          ],
        },
      },
    });
  }
};
