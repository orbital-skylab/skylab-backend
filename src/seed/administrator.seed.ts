import { createManyUsersWithAdministratorRole } from "src/helpers/administrators.helper";
import { generateFakeRoleData, generateFakeUser } from "./seed.helpers";
import { UserRolesEnum } from "src/validators/user.validator";
import { PASSWORD } from "./seed.constants";

type Batch = {
  count: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accounts: any[];
};

export const seedAdmins = async () => {
  const batch: Batch = { count: 11, accounts: [] };
  for (let i = 0; i < batch.count - 1; i++) {
    const account = {
      user: generateFakeUser(),
      administrator: generateFakeRoleData(UserRolesEnum.Administrator),
    };
    batch.accounts.push(account);
  }
  batch.accounts.push({
    user: { email: "admin@skylab.com", password: PASSWORD },
    administrator: generateFakeRoleData(UserRolesEnum.Administrator),
  });
  await createManyUsersWithAdministratorRole(batch, true);
};
