import { faker } from "@faker-js/faker";
import { type PrismaClient } from "@prisma/client";
import { NUM_MENTORS, NUM_TEAMS } from "./seed.constants";
import { generateHashedPassword } from "./seed.util";

export const seedMentors = async (prisma: PrismaClient) => {
  const academicYear = new Date().getFullYear();
  const password = await generateHashedPassword();

  for (let i = 1; i <= NUM_MENTORS; i++) {
    const userFirstName = faker.name.firstName();
    const userLastName = faker.name.lastName();

    await prisma.mentor.create({
      data: {
        cohort: {
          connect: {
            academicYear: academicYear,
          },
        },
        user: {
          create: {
            name: i === 1 ? "Mentor" : `${userFirstName} ${userLastName}`,
            password,
            email:
              i === 1
                ? "mentor@skylab.com"
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
        mentor: {
          connect: {
            id: i > 100 ? i - 100 : i,
          },
        },
      },
    });
  }
};
