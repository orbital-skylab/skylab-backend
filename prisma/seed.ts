import { PrismaClient } from "@prisma/client";
import { seedAdmins } from "./seed/admin.seed";
import { seedAdvisers } from "./seed/adviser.seed";
import { seedCohorts } from "./seed/cohort.seed";
import { seedMentors } from "./seed/mentor.seed";
import { seedStudents } from "./seed/student.seed";

const prisma = new PrismaClient();

async function main() {
  await seedCohorts(prisma);
  await seedStudents(prisma);
  await seedAdvisers(prisma);
  await seedMentors(prisma);
  await seedAdmins(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
