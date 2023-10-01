import { type PrismaClient } from "@prisma/client";

export const seedSubmissions = async (prisma: PrismaClient) => {
  const thisYear = new Date().getFullYear();

  const project = await prisma.project.findFirst({
    where: { students: { some: { user: { email: "student@skylab.com" } } } },
  });

  if (!project) {
    throw new Error(`Projects not seeded correctly`);
  }

  for (let i = 1; i <= 1; i++) {
    const question = await prisma.question.findFirst({
      where: { question: `dummy question for Milestone ${i}` },
    });

    if (!question) {
      throw new Error(`Questions not seeded correctly for Milestone ${i}`);
    }

    await prisma.submission.create({
      data: {
        isDraft: false,
        fromProject: {
          connect: {
            id: project.id,
          },
        },
        deadline: {
          connect: {
            name_cohortYear: {
              name: `Milestone ${i}`,
              cohortYear: thisYear,
            },
          },
        },
        answers: {
          create: {
            question: {
              connect: {
                id: question.id,
              },
            },
            answer: `dummy answer for Milestone ${i}`,
          },
        },
      },
    });
  }
};
