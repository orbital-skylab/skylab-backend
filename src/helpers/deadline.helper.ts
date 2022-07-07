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
import {
  createOneQuestion,
  deleteManyQuestions,
} from "src/models/questions.db";

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

export async function getQuestionsOfDeadlineById(deadlineId: number) {
  const deadlineWithQuestions = await findUniqueDeadlineWithQuestionsData({
    where: { id: deadlineId },
  });

  const { questions, ...deadlineData } = deadlineWithQuestions;
  return {
    deadline: deadlineData,
    questions: parseQuestionsInput(questions),
  };
}

export async function replaceQuestionsById(
  deadlineId: number,
  questions: (Omit<
    Prisma.QuestionCreateInput,
    "deadlineId" | "questionNumber" | "deadline" | "options"
  > & {
    options?: string[];
  })[]
) {
  await deleteManyQuestions({ where: { deadline: { id: deadlineId } } });

  const createdQuestions = await Promise.all(
    questions.map((question, index) => {
      return createQuestionHelper(deadlineId, question, index);
    })
  );

  return parseQuestionsInput(createdQuestions);
}

export async function createQuestionHelper(
  deadlineId: number,
  {
    options,
    ...question
  }: Omit<
    Prisma.QuestionCreateInput,
    "deadlineId" | "questionNumber" | "deadline" | "options" | "id"
  > & {
    options?: string[];
  },
  index: number
) {
  const parsedOptions = options?.map((option, index) => {
    return {
      order: index + 1,
      option: option,
    };
  });

  const createdQuestion = await createOneQuestion({
    data: {
      questionNumber: index + 1,
      ...question,
      deadline: { connect: { id: deadlineId } },
      options: parsedOptions
        ? { createMany: { data: parsedOptions } }
        : undefined,
    },
  });

  return createdQuestion;
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
