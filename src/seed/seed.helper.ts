import { createNewStudent } from "src/helpers/students.helper";
import { createManyAdvisers } from "src/helpers/advisers.helper";
import { createCohort } from "src/models/cohorts.db";
import { createOneDeadline } from "src/models/deadline.db";
import {
  batchCreateAdvisers,
  batchCreateMentors,
  batchCreateStudents,
  createCohortData,
  createDeadline1,
  createDeadline2,
  createDeadline3,
  createProject1,
} from "./seedData";
import { createManyMentors } from "src/helpers/mentors.helper";
import { createProjectHelper } from "src/helpers/projects.helper";

export const seedDummyData = async () => {
  //1. Create Cohort
  await createCohort(createCohortData);

  //2. Create Deadline
  await createOneDeadline({ data: createDeadline1 });
  await createOneDeadline({ data: createDeadline2 });
  await createOneDeadline({ data: createDeadline3 });

  //3. Create Students
  await Promise.all(
    batchCreateStudents.accounts.map((account) =>
      createNewStudent({ ...account }, true)
    )
  );

  //4. Create Advisers
  await createManyAdvisers(batchCreateAdvisers, true);

  //5. Create Mentors
  await createManyMentors(batchCreateMentors, true);

  //6. Create Project
  await createProjectHelper(createProject1);
};
