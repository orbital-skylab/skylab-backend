import { faker } from "@faker-js/faker";
import { createUserWithMentorRole } from "src/helpers/mentors.helper";
import { editProjectDataByProjectID } from "src/helpers/projects.helper";

export const seedMentors = async () => {
  for (let i = 0; i < 100; i++) {
    const userFirstName = faker.name.firstName();
    const userLastName = faker.name.lastName();
    await createUserWithMentorRole(
      {
        user: {
          name: `${userFirstName} ${userLastName}`,
          password: "Password123",
          email: faker.internet.email(userFirstName, userLastName),
        },
        mentor: {
          cohortYear: faker.helpers.arrayElement([
            2020, 2021, 2022, 2023, 2024,
          ]),
        },
      },
      true
    );
    await editProjectDataByProjectID(i + 1, {
      mentor: i,
    });
  }
};
