import { createUserWithAdviserRole } from "src/helpers/advisers.helper";
import { editProjectDataByProjectID } from "src/helpers/projects.helper";
import { UserRolesEnum } from "src/validators/user.validator";
import { generateFakeRoleData, generateFakeUser } from "./seed.helpers";

export const seedAdvisers = async () => {
  for (let i = 0; i < 100; i++) {
    await createUserWithAdviserRole(
      {
        user: generateFakeUser(),
        adviser: generateFakeRoleData(UserRolesEnum.Adviser),
      },
      true
    );
    await editProjectDataByProjectID(i + 1, {
      adviser: i,
    });
  }
};
