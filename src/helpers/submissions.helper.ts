import { Answer } from "@prisma/client";
import { createUniqueAnswer, deleteManyAnswers } from "src/models/answers.db";
import {
  createUniqueSubmission,
  findUniqueSubmission,
  updateUniqueSubmission,
} from "src/models/submissions.db";

export async function getSubmissionBySubmissionId(submissionId: number) {
  return await findUniqueSubmission({
    where: { id: submissionId },
    include: { answers: { include: { question: true } } },
  });
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
  await deleteManyAnswers({ where: { submissionId: submissionId } });

  if (isDraft) {
    await updateUniqueSubmission({
      where: { id: submissionId },
      data: { isDraft: isDraft },
    });
  }

  if (answers) {
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

  return await findUniqueSubmission({ where: { id: submissionId } });
}
