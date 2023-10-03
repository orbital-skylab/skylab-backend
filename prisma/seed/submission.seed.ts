import { DeadlineType, type PrismaClient } from "@prisma/client";

export const seedSubmissions = async (prisma: PrismaClient) => {
  const thisYear = new Date().getFullYear();

  const project = await prisma.project.findFirst({
    where: { students: { some: { user: { email: "student@skylab.com" } } } },
  });

  if (!project) {
    throw new Error(`Projects not seeded correctly`);
  }

  const student = await prisma.user.findFirst({ where: { name: "Student" } });
  if (!student) {
    throw new Error("Students not seeded correctly");
  }

  const adviser = await prisma.user.findFirst({ where: { name: "Adviser" } });
  if (!adviser) {
    throw new Error("Advisers not seeded correctly");
  }

  for (const deadlineType of [
    DeadlineType.Milestone,
    DeadlineType.Evaluation,
  ]) {
    for (let i = 1; i <= 1; i++) {
      const question = await prisma.question.findFirst({
        where: { question: `dummy question for ${deadlineType} ${i}` },
      });
      if (!question) {
        throw new Error(
          `Questions not seeded correctly for ${deadlineType} ${i}`
        );
      }

      await prisma.submission.create({
        data: {
          isDraft: false,
          fromUser: {
            connect: {
              id:
                deadlineType === DeadlineType.Milestone
                  ? student.id
                  : adviser.id,
            },
          },
          fromProject:
            deadlineType === DeadlineType.Milestone
              ? {
                  connect: {
                    id: project.id,
                  },
                }
              : undefined,
          toProject:
            deadlineType === DeadlineType.Evaluation
              ? {
                  connect: {
                    id: project.id,
                  },
                }
              : undefined,
          deadline: {
            connect: {
              name_cohortYear: {
                name: `${deadlineType} ${i}`,
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
              answer: `dummy answer for ${deadlineType} ${i}`,
            },
          },
        },
      });
    }
  }
};
