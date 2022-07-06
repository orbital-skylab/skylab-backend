import { seedAdmins } from "./administrator.seed";
import { seedAdvisers } from "./adviser.seed";
import { seedCohorts } from "./cohort.seed";
import { seedDeadlines } from "./deadline.seed";
import { seedMentors } from "./mentor.seed";
import { seedStudents } from "./student.seed";

export const seedAll = async () => {
  await seedCohorts();
  console.log("All Cohorts Seeded");
  await seedStudents();
  console.log("All Students Seeded");
  await seedMentors();
  console.log("All Mentors Seeded");
  await seedAdvisers();
  console.log("All Advisers Seeded");
  await seedAdmins();
  console.log("All Admins Seeded");
  await seedDeadlines();
  console.log("All Deadlines Seeded");
};
