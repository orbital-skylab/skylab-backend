import { faker } from "@faker-js/faker";
import { UserRolesEnum } from "src/validators/user.validator";
import { COHORT_YEAR, PASSWORD } from "./seed.constants";

export const generateFakeUser = () => {
  const userFirstName = faker.name.firstName();
  const userLastName = faker.name.lastName();

  return {
    name: `${userFirstName} ${userLastName}`,
    password: PASSWORD,
    email: faker.internet.email(userFirstName, userLastName),
    profilePicUrl: faker.image.imageUrl(),
    githubUrl: faker.internet.url(),
    linkedinUrl: faker.internet.url(),
    personalSiteUrl: faker.internet.url(),
    selfIntro: faker.lorem.sentence(),
  };
};

export const generateFakeRoleData = (role: UserRolesEnum) => {
  return {
    ...(role !== UserRolesEnum.Administrator
      ? { cohortYear: COHORT_YEAR }
      : {}),
    ...(role === UserRolesEnum.Administrator
      ? {
          startDate: faker.date.between(
            new Date(COHORT_YEAR - 1, 0, 0).toISOString(),
            new Date(COHORT_YEAR, 0, 0).toISOString()
          ),
          endDate: faker.date.between(
            new Date(COHORT_YEAR + 1, 0, 0).toISOString(),
            new Date(COHORT_YEAR + 2, 0, 0).toISOString()
          ),
        }
      : {}),
    ...([UserRolesEnum.Student, UserRolesEnum.Adviser].includes(role)
      ? {
          matricNo: faker.random.alphaNumeric(7),
          nusnetId: faker.random.alphaNumeric(7),
        }
      : {}),
  };
};
