import { DeadlineType, QuestionType, type PrismaClient } from "@prisma/client";

export const seedDeadlines = async (prisma: PrismaClient) => {
  const today = new Date();
  const thisYear = today.getFullYear();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  for (let i = 1; i <= 3; i++) {
    await prisma.deadline.create({
      data: {
        name: `Milestone ${i}`,
        type: DeadlineType.Milestone,
        dueBy: nextWeek,
        cohort: {
          connect: {
            academicYear: thisYear,
          },
        },
        sections: {
          create: {
            name: `dummy section for Milestone ${i}`,
            desc: "",
            sectionNumber: 1,
            questions: {
              create: {
                question: `dummy question for Milestone ${i}`,
                type: QuestionType.ShortAnswer,
                desc: "",
                questionNumber: 1,
              },
            },
          },
        },
      },
    });

    await prisma.deadline.create({
      data: {
        name: `Evaluation for Milestone ${i}`,
        type: DeadlineType.Evaluation,
        dueBy: nextWeek,
        cohort: {
          connect: {
            academicYear: thisYear,
          },
        },
        sections: {
          create: {
            name: `dummy section for Evalation for Milestone ${i}`,
            desc: "",
            sectionNumber: 1,
            questions: {
              create: {
                question: `dummy question for Evalation for Milestone ${i}`,
                type: QuestionType.ShortAnswer,
                desc: "",
                questionNumber: 1,
              },
            },
          },
        },
      },
    });
  }
};
