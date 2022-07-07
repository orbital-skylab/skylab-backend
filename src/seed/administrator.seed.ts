import { createManyUsersWithAdministratorRole } from "src/helpers/administrators.helper";
import { generateFakeRoleData, generateFakeUser } from "./seed.helpers";
import { UserRolesEnum } from "src/validators/user.validator";

type Batch = {
  count: number;
  accounts: any[];
};

export const seedAdmins = async () => {
  const batch: Batch = { count: 10, accounts: [] };
  for (let i = 0; i < batch.count; i++) {
    const account = {
      user: generateFakeUser(),
      administrator: generateFakeRoleData(UserRolesEnum.Administrator),
    };
    batch.accounts.push(account);
  }

  await createManyUsersWithAdministratorRole(batch, true);
};
