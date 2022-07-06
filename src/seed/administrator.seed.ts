import { createManyUsersWithAdministratorRole } from "src/helpers/administrators.helper";
import { faker } from "@faker-js/faker";

const password = "Password123";
type Batch = {
  count: number;
  accounts: any[];
};

export const seedStudents = async () => {
  const batch: Batch = { count: 100, accounts: [] };
  for (let i = 0; i < batch.count; i++) {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const account = {
      user: {
        name: `${firstName} ${lastName}`,
        email: faker.internet.email(firstName, lastName, "skylab.com"),
        password,
      },
      administrator: {
        startDate: faker.date.between(
          "2020-01-01T00:00:00.000Z",
          "2021-01-01T00:00:00.000Z"
        ),
        endDate: faker.date.between(
          "2022-01-01T00:00:00.000Z",
          "2023-01-01T00:00:00.000Z"
        ),
      },
    };
    batch.accounts.push(account);
  }

  await createManyUsersWithAdministratorRole(batch, true);
};
