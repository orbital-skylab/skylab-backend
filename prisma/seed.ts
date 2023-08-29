import { PrismaClient } from "@prisma/client";
import { seedCohorts } from "./seed/cohort.seed";
import { seedStudents } from "./seed/student.seed";
import { seedAdvisers } from "./seed/adviser.seed";
import { seedMentors } from "./seed/mentor.seed";
import { seedAdmin } from "./seed/administrator.seed";

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();

  await seedCohorts(prisma).then(() =>
    console.log("cohorts seeded successfully")
  );
  await seedStudents(prisma).then(() =>
    console.log("students seeded successfully")
  );
  await seedAdvisers(prisma).then(() =>
    console.log("advisers seeded successfully")
  );
  await seedMentors(prisma).then(() =>
    console.log("mentors seeded successfully")
  );
  await seedAdmin(prisma).then(() => console.log("admins seeded successfully"));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
