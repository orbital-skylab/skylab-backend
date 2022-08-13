import { createManyUsersWithStudentRole } from "src/helpers/students.helper";
import { faker } from "@faker-js/faker";
import { AchievementLevel } from "@prisma/client";
import { COHORT_YEAR } from "./seed.constants";
import { generateFakeRoleData, generateFakeUser } from "./seed.helpers";
import { UserRolesEnum } from "src/validators/user.validator";

type Batch = {
  count: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projects: any[];
};

export const seedStudents = async () => {
  const batch: Batch = { count: 100, projects: [] };
  for (let i = 0; i < batch.count; i++) {
    const project = {
      name: `${faker.word.adjective()} ${faker.word.noun()}`,
      teamName: `Team ${faker.word.adjective()} ${faker.word.noun()}`,
      achievement: faker.helpers.arrayElement(Object.values(AchievementLevel)),
      cohortYear: COHORT_YEAR,
      proposalPdf: faker.internet.url(),
      students: [
        {
          user: generateFakeUser(),
          student: generateFakeRoleData(UserRolesEnum.Student),
        },
        {
          user: generateFakeUser(),
          student: generateFakeRoleData(UserRolesEnum.Student),
        },
      ],
    };
    batch.projects.push(project);
  }

  return createManyUsersWithStudentRole(batch, true);
};
