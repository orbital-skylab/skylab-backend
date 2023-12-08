import { Prisma } from "@prisma/client";
import { prisma } from "../client";

export async function findUniqueSubmission(
  query: Prisma.SubmissionFindUniqueArgs
) {
  const uniqueSubmission = await prisma.submission.findUnique(query);
  return uniqueSubmission;
}

export async function findFirstSubmission(
  query: Prisma.SubmissionFindFirstArgs
) {
  const firstSubmission = await prisma.submission.findFirst(query);
  return firstSubmission;
}

export async function findFirstNonDraftSubmission({
  where,
  ...query
}: Prisma.SubmissionFindFirstArgs) {
  const firstSubmission = await prisma.submission.findFirst({
    where: { ...where, isDraft: false },
    ...query,
  });
  return firstSubmission;
}

export async function findManySubmissions(
  query: Prisma.SubmissionFindManyArgs
) {
  const submissions = await prisma.submission.findMany(query);
  return submissions;
}

export async function createUniqueSubmission(
  query: Prisma.SubmissionCreateArgs
) {
  const createdSubmission = await prisma.submission.create(query);
  return createdSubmission;
}

export async function updateUniqueSubmission(
  query: Prisma.SubmissionUpdateArgs
) {
  const updatedSubmission = await prisma.submission.update(query);
  return updatedSubmission;
}

export async function deleteUniqueSubmission(
  query: Prisma.SubmissionDeleteArgs
) {
  const deletedSubmission = await prisma.submission.delete(query);
  return deletedSubmission;
}
