import { createManyUsersWithStudentRole } from "src/helpers/students.helper";
import { faker } from "@faker-js/faker";
import { AchievementLevel } from "@prisma/client";

const password = "Password123";
type Batch = {
  count: number;
  projects: any[];
};

export const seedStudents = async () => {
  const batch: Batch = { count: 100, projects: [] };
  for (let i = 0; i < batch.count; i++) {
    const firstName1 = faker.name.firstName();
    const lastName1 = faker.name.lastName();
    const firstName2 = faker.name.firstName();
    const lastName2 = faker.name.lastName();
    const cohortYear = faker.helpers.arrayElement([
      2020, 2021, 2022, 2023, 2024,
    ]);
    const project = {
      name: faker.name.findName(),
      achievement: faker.helpers.arrayElement(Object.values(AchievementLevel)),
      cohortYear,
      proposalPdf: faker.internet.url(),
      students: [
        {
          user: {
            name: `${firstName1} ${lastName1}`,
            email: faker.internet.email(firstName1, lastName1, "skylab.com"),
            password,
          },
          student: {
            matricNo: faker.random.alphaNumeric(7),
            nusnetId: faker.random.alphaNumeric(7),
            cohortYear,
          },
        },
        {
          user: {
            name: `${firstName2} ${lastName2}`,
            email: faker.internet.email(firstName2, lastName2, "skylab.com"),
            password,
          },
          student: {
            matricNo: faker.random.alphaNumeric(7),
            nusnetId: faker.random.alphaNumeric(7),
            cohortYear,
          },
        },
      ],
    };
    batch.projects.push(project);
  }

  await createManyUsersWithStudentRole(batch, true);
};
