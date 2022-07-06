import { faker } from "@faker-js/faker";
import { createUserWithAdviserRole } from "src/helpers/advisers.helper";
import { editProjectDataByProjectID } from "src/helpers/projects.helper";
export const seedAdvisers = async () => {
  for (let i = 0; i < 100; i++) {
    const userFirstName = faker.name.firstName();
    const userLastName = faker.name.lastName();
    await createUserWithAdviserRole(
      {
        user: {
          name: `${userFirstName} ${userLastName}`,
          password: "Password123",
          email: faker.internet.email(
            userFirstName,
            userLastName,
            "skylab.com"
          ),
        },
        adviser: {
          nusnetId: faker.random.alphaNumeric(7),
          matricNo: faker.random.alphaNumeric(7),
          cohortYear: faker.helpers.arrayElement([
            2020, 2021, 2022, 2023, 2024,
          ]),
        },
      },
      true
    );
    await editProjectDataByProjectID(i + 1, {
      adviser: i,
    });
  }
};
