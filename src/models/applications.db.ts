import { Application, Prisma } from "@prisma/client";
import { prisma } from "../client";

export async function findManyApplicationsWithFilter({
  whereQuery,
  page,
  limit,
}: {
  whereQuery: Prisma.SubmissionWhereInput;
  page: number;
  limit: number;
}) {
  const applicationSubmissions = await prisma.submission.findMany({
    where: whereQuery.application
      ? whereQuery
      : { ...whereQuery, application: { isNot: undefined } },
    select: {
      application: true,
    },
    take: limit ?? undefined,
    skip: limit && page ? limit * page : undefined,
  });

  return (applicationSubmissions?.map((submission) => submission.application) ??
    []) as Application[];
}

export async function findUniqueApplication(
  query: Omit<Prisma.ApplicationFindUniqueArgs, "include">
) {
  const application = await prisma.application.findUnique({
    ...query,
    include: {
      applicants: true,
    },
  });

  return application;
}

export async function updateUniqueApplication(
  query: Prisma.ApplicationUpdateArgs
) {
  const updatedApplication = await prisma.application.update(query);

  return updatedApplication;
}

export async function deleteUniqueApplication(
  query: Prisma.ApplicationDeleteArgs
) {
  const deletedApplication = await prisma.application.delete(query);
  await prisma.submission.delete({
    where: { id: deletedApplication.submissionId },
  });

  return deletedApplication;
}
