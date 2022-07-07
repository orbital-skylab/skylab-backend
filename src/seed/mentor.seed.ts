import { createUserWithMentorRole } from "src/helpers/mentors.helper";
import { editProjectDataByProjectID } from "src/helpers/projects.helper";
import { UserRolesEnum } from "src/validators/user.validator";
import { generateFakeRoleData, generateFakeUser } from "./seed.helpers";

export const seedMentors = async () => {
  for (let i = 0; i < 100; i++) {
    await createUserWithMentorRole(
      {
        user: generateFakeUser(),
        mentor: generateFakeRoleData(UserRolesEnum.Mentor),
      },
      true
    );
    await editProjectDataByProjectID(i + 1, {
      mentor: i,
    });
  }
};
