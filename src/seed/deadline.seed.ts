import { faker } from "@faker-js/faker";
import { createDeadline } from "src/helpers/deadline.helper";
import { cohorts } from "./cohort.seed";

export const seedDeadlines = async () => {
  for (let j = 0; j < 5; j++) {
    for (let i = 0; i < 4; i++) {
      await createDeadline({
        deadline: {
          cohortYear: j + 2020,
          desc: faker.lorem.lines(2),
          name: i == 0 ? "Pre Liftoff Survey" : `Milestone ${i}`,
          dueBy: faker.date.between(cohorts[j].startDate, cohorts[j].endDate),
          type: i == 0 ? "Feedback" : "Milestone",
        },
      });
    }
  }
};
