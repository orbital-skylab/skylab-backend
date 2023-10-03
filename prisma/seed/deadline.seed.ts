import { DeadlineType, QuestionType, type PrismaClient } from "@prisma/client";

export const seedDeadlines = async (prisma: PrismaClient) => {
  const today = new Date();
  const thisYear = today.getFullYear();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const milestoneIds: number[] = [];
  for (const deadlineType of [
    DeadlineType.Milestone,
    DeadlineType.Evaluation,
  ]) {
    for (let i = 1; i <= 3; i++) {
      const deadline = await prisma.deadline.create({
        data: {
          name: `${deadlineType} ${i}`,
          type: deadlineType,
          dueBy: nextWeek,
          evaluating:
            deadlineType === DeadlineType.Evaluation
              ? {
                  connect: {
                    id: milestoneIds[i - 1],
                  },
                }
              : undefined,
          cohort: {
            connect: {
              academicYear: thisYear,
            },
          },
          sections: {
            create: {
              name: `dummy section for ${deadlineType} ${i}`,
              desc: "",
              sectionNumber: 1,
              questions: {
                create: {
                  question: `dummy question for ${deadlineType} ${i}`,
                  type: QuestionType.ShortAnswer,
                  desc: "",
                  questionNumber: 1,
                },
              },
            },
          },
        },
      });

      if (deadlineType === DeadlineType.Milestone) {
        milestoneIds.push(deadline.id);
      }
    }
  }
};
