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
    cohortYear: role !== UserRolesEnum.Administrator ? COHORT_YEAR : undefined,
    startDate:
      role === UserRolesEnum.Administrator
        ? faker.date.between(
            new Date(COHORT_YEAR - 1, 0, 0).toISOString(),
            new Date(COHORT_YEAR, 0, 0).toISOString()
          )
        : undefined,
    endDate:
      role === UserRolesEnum.Administrator
        ? faker.date.between(
            new Date(COHORT_YEAR + 1, 0, 0).toISOString(),
            new Date(COHORT_YEAR + 2, 0, 0).toISOString()
          )
        : undefined,
    matricNo: [UserRolesEnum.Student, UserRolesEnum.Adviser].includes(role)
      ? faker.random.alphaNumeric(7)
      : undefined,
    nusnetId: [UserRolesEnum.Student, UserRolesEnum.Adviser].includes(role)
      ? faker.random.alphaNumeric(7)
      : undefined,
  };
};
