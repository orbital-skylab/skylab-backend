import { Prisma } from "@prisma/client";
import { prisma } from "src/client";

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

export async function findManySubmissions(
  query: Prisma.SubmissionFindManyArgs
) {
  const submissions = await prisma.submission.findMany(query);
  return submissions;
}
