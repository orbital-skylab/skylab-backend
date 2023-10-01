/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Prisma,
  Question,
  DeadlineType,
  Option,
  AchievementLevel,
} from "@prisma/client";
import { prisma } from "../client";
import { SkylabError } from "../errors/SkylabError";
import {
  createOneDeadline,
  deleteOneDeadline,
  findManyDeadlines,
  findUniqueDeadline,
  findUniqueDeadlineWithQuestionsData,
  updateOneDeadline,
} from "../models/deadline.db";
import { createOneQuestion } from "../models/questions.db";
import { createOneSection, deleteManySections } from "../models/sections.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";

export async function getManyDeadlinesWithFilter(
  query: any & { cohortYear?: number; name?: string }
) {
  const { cohortYear, name } = query;

  const deadlinesQuery: Prisma.DeadlineFindManyArgs = {
    where: {
      cohortYear: cohortYear ?? undefined,
      name: { contains: name, mode: "insensitive" },
    },
  };

  const deadlines = await findManyDeadlines(deadlinesQuery);

  return deadlines;
}

export async function createDeadline(body: {
  deadline: {
    cohortYear: number;
    name: string;
    dueBy: Date;
    type: DeadlineType;
    desc?: string;
    evaluatingMilestoneId?: number; // If type == "Evaluation"
  };
}) {
  const { deadline: deadlineData } = body;
  const { evaluatingMilestoneId, cohortYear, ...deadline } = deadlineData;

  const createdDeadline = await createOneDeadline({
    data: {
      cohort: { connect: { academicYear: cohortYear } },
      ...deadline,
      evaluating:
        deadline.type === DeadlineType.Evaluation
          ? {
              connect: { id: evaluatingMilestoneId },
            }
          : undefined,
    },
  });

  if (!createdDeadline) {
    throw new SkylabError(
      "Error occurred while creating deadline",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  if (deadline.type === DeadlineType.Application) {
    const teamParticularsSection = await prisma.section.create({
      data: {
        sectionNumber: 1,
        name: "Team Particulars",
        deadline: {
          connect: {
            id: createdDeadline.id,
          },
        },
        questions: {
          createMany: {
            data: [
              {
                questionNumber: 1,
                question: "Student 1 Name",
                type: "ShortAnswer",
                desc: "",
              },
              {
                questionNumber: 2,
                question: "Student 2 Name",
                type: "ShortAnswer",
                desc: "",
              },
              {
                questionNumber: 3,
                question: "Student 1 Email",
                type: "ShortAnswer",
                desc: "",
              },
              {
                questionNumber: 4,
                question: "Student 2 Email",
                type: "ShortAnswer",
                desc: "",
              },
              {
                questionNumber: 5,
                question: "Student 1 Matriculation Number",
                type: "ShortAnswer",
                desc: "",
              },
              {
                questionNumber: 6,
                question: "Student 2 Matriculation Number",
                type: "ShortAnswer",
                desc: "",
              },
              {
                questionNumber: 7,
                question: "Student 1 NUSNET ID",
                type: "ShortAnswer",
                desc: "",
              },
              {
                questionNumber: 8,
                question: "Student 2 NUSNET ID",
                type: "ShortAnswer",
                desc: "",
              },
              {
                questionNumber: 9,
                question: "Team Name",
                type: "ShortAnswer",
                desc: "",
              },
            ],
          },
        },
      },
    });

    await prisma.question.create({
      data: {
        questionNumber: 10,
        question: "Proposed Level of Achievement",
        type: "Dropdown",
        desc: "",
        options: {
          createMany: {
            data: Object.values(AchievementLevel).map((achievement, idx) => ({
              option: achievement,
              order: idx,
            })),
          },
        },
        section: {
          connect: {
            id: teamParticularsSection.id,
          },
        },
      },
    });
  }

  return await findUniqueDeadline({ where: { id: createdDeadline.id } });
}

export async function getOneDeadlineById(deadlineId: number) {
  const deadline = await findUniqueDeadline({ where: { id: deadlineId } });
  return deadline;
}

export function parseQuestionsInput(
  questions: (Question & { options?: Option[] })[]
) {
  const parsedQuestions = questions.map(({ options, ...question }) => {
    return {
      ...question,
      options: options ? options.map((option) => option.option) : undefined,
    };
  });

  return parsedQuestions;
}

export async function getAllQuestionsById(deadlineId: number) {
  const deadlineWithQuestions = await findUniqueDeadlineWithQuestionsData({
    where: { id: deadlineId },
  });

  const { sections, ...deadlineData } = deadlineWithQuestions;
  return {
    deadline: { ...deadlineData },
    sections: sections.map((section) => {
      const { questions, ...sectionData } = section;
      return {
        ...sectionData,
        questions: parseQuestionsInput(questions),
      };
    }),
  };
}

export async function replaceSectionsById(
  deadlineId: number,
  sections: (Omit<
    Prisma.SectionCreateInput,
    "sectionNumber" | "deadlineId" | "deadline"
  > & {
    questions: (Omit<
      Prisma.QuestionCreateInput,
      "deadlineId" | "questionNumber" | "deadline" | "options" | "id"
    > & {
      options?: string[];
    })[];
  })[]
) {
  /* Delete all the previous questions */
  await deleteManySections({ where: { deadlineId: deadlineId } });

  const pCreateSections = sections.map(async (section, index) => {
    const sectionNumber: number = index + 1;
    const { questions, ...sectionData } = section;
    const createdSection = await createOneSection({
      data: {
        ...sectionData,
        sectionNumber: sectionNumber,
        deadline: { connect: { id: deadlineId } },
      },
    });
    const createdQuestions = await Promise.all(
      questions.map(async (question, index) => {
        const questionNumber = index + 1;
        const { options: optionsData, ...questionData } = question;

        const options = optionsData?.map((option, optionIndex) => {
          return {
            order: optionIndex + 1,
            option: option,
          };
        });

        const createdQuestion = await createOneQuestion({
          data: {
            ...questionData,
            questionNumber: questionNumber,
            section: { connect: { id: createdSection.id } },
            options: options ? { createMany: { data: options } } : undefined,
          },
        });
        return createdQuestion;
      })
    );
    return { section: createdSection, questions: createdQuestions };
  });

  const createdSections = await Promise.all(pCreateSections);
  return createdSections;
}

export async function editDeadlineByDeadlineId(
  deadlineId: number,
  body: {
    deadline: Omit<Prisma.DeadlineUpdateInput, "cohort" | "questions"> & {
      evaluatingMilestoneId?: number;
    };
  }
) {
  const { evaluatingMilestoneId, ...deadline } = body.deadline;
  const updatedDeadline = await updateOneDeadline({
    where: { id: deadlineId },
    data: {
      ...deadline,
      evaluating: evaluatingMilestoneId
        ? { connect: { id: evaluatingMilestoneId } }
        : undefined,
    },
    include: { evaluating: true },
  });
  return updatedDeadline;
}

export async function deleteOneDeadlineByDeadlineId(deadlineId: number) {
  const deletedDeadline = await deleteOneDeadline({
    where: { id: deadlineId },
  });
  return deletedDeadline;
}

export async function duplicateDeadlineByDeadlineId(
  deadlineId: number,
  cohortYear: number
) {
  const deadline = await getOneDeadlineById(deadlineId);
  if (!deadline) return null;
  const { name, dueBy, type, desc, evaluatingMilestoneId } = deadline;
  const duplicatedDeadline = await createDeadline({
    deadline: {
      cohortYear,
      name: `Copy of ${name}`,
      dueBy,
      type,
      desc: desc as string | undefined,
      evaluatingMilestoneId: evaluatingMilestoneId as number | undefined,
    },
  });
  return duplicatedDeadline;
}
