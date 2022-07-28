import { Answer } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import { createUniqueAnswer, deleteManyAnswers } from "src/models/answers.db";
import { findUniqueDeadlineWithQuestionsData } from "src/models/deadline.db";
import {
  createUniqueSubmission,
  findUniqueSubmission,
  updateUniqueSubmission,
} from "src/models/submissions.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

export async function getSubmissionBySubmissionId(submissionId: number) {
  const submission = await findUniqueSubmission({
    where: { id: submissionId },
    include: {
      answers: { include: { question: true } },
      fromProject: true,
      fromUser: true,
      toProject: true,
      toUser: true,
    },
  });

  if (!submission) {
    throw new SkylabError(
      "Submission with this ID was not found",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const { deadlineId } = submission;
  const deadlineWithQuestions = await findUniqueDeadlineWithQuestionsData({
    where: { id: deadlineId },
  });

  const { sections, ...deadlineData } = deadlineWithQuestions;

  return {
    ...submission,
    deadline: deadlineData,
    sections: sections,
  };
}

export async function createOneSubmission(body: {
  submission: {
    deadlineId: number;
    answers?: Omit<Answer, "submissionId">[];
    fromProjectId?: number;
    fromUserId?: number;
    toProjectId?: number;
    toUserId?: number;
  };
}) {
  const { submission } = body;
  const {
    deadlineId,
    answers,
    fromProjectId,
    fromUserId,
    toProjectId,
    toUserId,
  } = submission;
  const createdSubmission = await createUniqueSubmission({
    data: {
      deadline: { connect: { id: deadlineId } },
      fromProject: fromProjectId
        ? { connect: { id: fromProjectId } }
        : undefined,
      toProject: toProjectId ? { connect: { id: toProjectId } } : undefined,
      fromUser: fromUserId ? { connect: { id: fromUserId } } : undefined,
      toUser: toUserId ? { connect: { id: toUserId } } : undefined,
    },
  });

  if (!answers) {
    return createdSubmission;
  }

  const createdAnswers = await Promise.all(
    answers.map(async ({ questionId, answer }) => {
      return await createUniqueAnswer({
        data: {
          submission: { connect: { id: createdSubmission.id } },
          question: { connect: { id: questionId } },
          answer: answer,
        },
      });
    })
  );

  return {
    ...createdSubmission,
    answers: createdAnswers,
  };
}

export async function updateOneSubmissionBySubmissionId(
  submissionId: number,
  data: { answers?: Omit<Answer, "submissionId">[]; isDraft?: boolean }
) {
  const { answers, isDraft } = data;

  if (answers) {
    await deleteManyAnswers({ where: { submissionId: submissionId } });
    await Promise.all(
      answers.map(async ({ questionId, answer }) => {
        return await createUniqueAnswer({
          data: {
            submission: { connect: { id: submissionId } },
            question: { connect: { id: questionId } },
            answer: answer,
          },
        });
      })
    );
  }

  if (typeof isDraft !== "undefined") {
    await updateUniqueSubmission({
      where: { id: submissionId },
      data: { isDraft: isDraft },
    });
  }

  return await findUniqueSubmission({ where: { id: submissionId } });
}
