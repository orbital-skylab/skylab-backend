/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, Question, DeadlineType, Option } from "@prisma/client";
import {
  createOneDeadline,
  deleteOneDeadline,
  findManyDeadlines,
  findUniqueDeadline,
  findUniqueDeadlineWithQuestionsData,
  updateOneDeadline,
} from "src/models/deadline.db";
import { createOneQuestion } from "src/models/questions.db";
import { createOneSection, deleteManySections } from "src/models/sections.db";

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

export async function createDeadline(
  body: any & {
    deadline: {
      cohortYear: number;
      desc?: string;
      name: string;
      dueBy: Date;
      type: DeadlineType;
    };
  }
) {
  const { cohortYear, desc, name, dueBy, type } = body.deadline;
  return await createOneDeadline({
    data: {
      cohort: { connect: { academicYear: cohortYear } },
      desc: desc ?? undefined,
      name: name,
      dueBy: dueBy,
      type: type,
    },
  });
}

export async function getOneDeadlineById(deadlineId: number) {
  const deadline = await findUniqueDeadline({ where: { id: deadlineId } });
  return deadline;
}

export function parseQuestionsInput(
  questions: (Question & { options?: Option[] })[]
) {
  const parsedQuestions = questions.map(({ options, ...question }) => {
    const optionsStringArr = options?.map((option) => option.option);
    return {
      ...question,
      options: optionsStringArr ? optionsStringArr : undefined,
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
    const sectionNumber = index + 1;
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
  body: any & {
    deadline: Omit<
      Prisma.DeadlineUpdateInput,
      "cohort" | "cohortYear" | "questions"
    >;
  }
) {
  const deadline: Prisma.DeadlineUpdateInput = body.deadline;
  const updatedDeadline = await updateOneDeadline({
    where: { id: deadlineId },
    data: deadline,
  });
  return updatedDeadline;
}

export async function deleteOneDeadlineByDeadlineId(deadlineId: number) {
  const deletedDeadline = await deleteOneDeadline({
    where: { id: deadlineId },
  });
  return deletedDeadline;
}
