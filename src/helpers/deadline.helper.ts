/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, Question } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import {
  createOneDeadline,
  deleteOneDeadline,
  getManyDeadlines,
  getOneDeadline,
  updateDeadline,
} from "src/models/deadline.db";
import {
  createOneQuestion,
  deleteManyQuestions,
} from "src/models/questions.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

export const createNewDeadlineParser = (
  body: any
): Prisma.DeadlineCreateInput => {
  if (!body.deadline) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  const { deadline } = body;

  if (
    !(deadline.cohortYear && deadline.name && deadline.dueBy && deadline.type)
  ) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST,
      body
    );
  }

  const { cohortYear, dueBy, ...deadlineData } = deadline;

  return {
    cohort: { connect: { academicYear: cohortYear } },
    dueBy: new Date(dueBy),
    ...deadlineData,
  };
};

export const createNewDeadline = async (body: any) => {
  const deadline = createNewDeadlineParser(body);

  try {
    return await createOneDeadline({ data: deadline });
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      throw new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    } else {
      throw e;
    }
  }
};

export const getFilteredDeadlines = async (filter: any) => {
  const { cohortYear, name } = filter;
  try {
    const deadlines = await getManyDeadlines({
      where: {
        cohortYear: cohortYear ? Number(cohortYear) : undefined,
        name: name ? name : undefined,
      },
      orderBy: {
        dueBy: "asc",
      },
    });
    return deadlines;
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      throw new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
    throw e;
  }
};

export const getDeadlineById = async (deadlineId: string) => {
  try {
    return await getOneDeadline({ where: { id: Number(deadlineId) } });
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      throw new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    } else {
      throw e;
    }
  }
};

export const updateOneDeadline = async (
  deadlineId: string,
  updates: Omit<Prisma.DeadlineUpdateInput, "questions">
) => {
  try {
    return await updateDeadline({
      where: { id: Number(deadlineId) },
      data: updates,
    });
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      throw new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
    throw e;
  }
};

export const deleteDeadlineById = async (deadlineId: string) => {
  try {
    return await deleteOneDeadline({ where: { id: Number(deadlineId) } });
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      throw new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
    throw e;
  }
};

export const getAllQuestionsOfDeadline = async (deadlineId: string) => {
  try {
    const rawDeadlinePayload = await getOneDeadline({
      where: { id: Number(deadlineId) },
      include: {
        questions: {
          orderBy: { questionNumber: "asc" },
          include: {
            options: {
              select: { option: true },
            },
          },
        },
      },
    });

    if (!rawDeadlinePayload) {
      throw new SkylabError(
        `Could not find deadline of ID: ${deadlineId}`,
        HttpStatusCode.BAD_REQUEST
      );
    }
    return getAllQuestionsOfDeadlineParser(
      <
        Prisma.DeadlineGetPayload<{
          include: { questions: { include: { options: true } } };
        }>
      >rawDeadlinePayload
    );
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      throw new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
    throw e;
  }
};

export const getAllQuestionsOfDeadlineParser = async (
  deadlineWithQuestions: Prisma.DeadlineGetPayload<{
    include: { questions: { include: { options: true } } };
  }>
) => {
  const { questions, ...deadline } = deadlineWithQuestions;
  return {
    questions: questions.map((question) => {
      const { options, ...questionData } = question;
      return {
        options: options.map((option) => option.option),
        ...questionData,
      };
    }),
    deadline: deadline,
  };
};

export const replaceQuestionsOfDeadline = async (
  deadlineId: string,
  questions: Omit<Question & { options: string[] }, "deadlineId">[]
) => {
  try {
    // delete all current questions for the deadline
    await deleteManyQuestions({ where: { deadlineId: Number(deadlineId) } });

    const createQuestions = await Promise.all(
      questions.map(async (question) => {
        const { options, ...questionData } = question;
        return await createOneQuestion({
          data: {
            ...questionData,
            deadlineId: Number(deadlineId),
            options: options
              ? {
                  createMany: {
                    data: options.map((option, index) => {
                      return { option: option, order: Number(index + 1) };
                    }),
                  },
                }
              : undefined,
          },
        });
      })
    );
    return createQuestions;
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      throw new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
    throw e;
  }
};
