import { PrismaClient } from "@prisma/client";
import { seedCohorts } from "./seed/cohort.seed";
import { seedStudents } from "./seed/student.seed";
import { seedAdvisers } from "./seed/adviser.seed";
import { seedMentors } from "./seed/mentor.seed";
import { seedAdmin } from "./seed/administrator.seed";
import { seedDeadlines } from "./seed/deadline.seed";
import { seedSubmissions } from "./seed/submission.seed";
import { seedForumPosts } from "./seed/forum.seed";

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();

  await seedCohorts(prisma).then(() => console.log("cohorts seeded"));
  await seedStudents(prisma).then(() => console.log("students seeded"));
  await seedAdvisers(prisma).then(() => console.log("advisers seeded"));
  await seedMentors(prisma).then(() => console.log("mentors seeded"));
  await seedAdmin(prisma).then(() => console.log("admins seeded"));
  await seedDeadlines(prisma).then(() => console.log("deadlines seeded"));
  await seedSubmissions(prisma).then(() => console.log("submissions seeded"));
  await seedForumPosts(prisma).then(() => console.log("forumPosts seeded"));
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
