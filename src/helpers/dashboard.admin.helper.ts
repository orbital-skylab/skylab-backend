/* eslint-disable @typescript-eslint/no-explicit-any */
import { Project, Submission, User } from "@prisma/client";
import { findUniqueDeadline } from "src/models/deadline.db";
import { findManyProjectsWithUserData } from "src/models/projects.db";
import { findManyRelationsWithFromToProjectData } from "src/models/relations.db";
import { findFirstNonDraftSubmission } from "src/models/submissions.db";

export enum SubmissionStatusEnum {
  UNSUBMITTED = "Unsubmitted",
  SUBMITTED = "Submitted",
  SUBMITTED_LATE = "Submitted_Late",
}

export async function getSubmissionsByDeadlineId(
  query: any & {
    cohortYear: number;
    deadlineId: number;
    submissionStatus?: SubmissionStatusEnum;
    search?: string;
    page?: number;
    limit?: number;
  }
) {
  const { submissionStatus, search, cohortYear, page, limit, deadlineId } =
    query;

  const deadline = await findUniqueDeadline({ where: { id: deadlineId } });
  const projects = await findManyProjectsWithUserData({
    where: {
      cohortYear: cohortYear,
      name: search ? { contains: search } : undefined,
    },
    take: query.limit ?? undefined,
    skip: query.limit && query.page ? limit * page : undefined,
  });
  const projectIds = projects.map(({ id }) => id);

  let results: {
    fromProject: Project;
    toUser?: User;
    toProject?: Project;
    submission?: Submission;
  }[];
  if (deadline.type == "Evaluation") {
    const relations = await findManyRelationsWithFromToProjectData({
      where: { fromProjectId: { in: projectIds } },
    });
    const pSubmissions = relations.map(async (relation) => {
      const submission = await findFirstNonDraftSubmission({
        where: {
          deadlineId: deadlineId,
          fromProjectId: relation.fromProjectId,
          toProjectId: relation.toProjectId,
        },
      });
      return {
        fromProject: relation.fromProject,
        toProject: relation.toProject,
        submission: submission ? submission : undefined,
      };
    });
    results = await Promise.all(pSubmissions);
  } else if (deadline.type == "Feedback") {
    const pSubmissions = projects.map(async (project) => {
      const submission = await findFirstNonDraftSubmission({
        where: {
          deadlineId: deadlineId,
          fromProjectId: project.id,
          toUserId: project.adviserId,
        },
      });
      return {
        fromProject: project,
        toUser: project.adviser?.user,
        submission: submission ? submission : undefined,
      };
    });
    results = await Promise.all(pSubmissions);
  } else {
    const pSubmissions = projects.map(async (project) => {
      const submission = await findFirstNonDraftSubmission({
        where: {
          deadlineId: deadlineId,
          fromProjectId: project.id,
        },
      });
      return {
        fromProject: project,
        submission: submission ? submission : undefined,
      };
    });
    results = await Promise.all(pSubmissions);
  }

  if (!submissionStatus) {
    return results;
  } else {
    const filteredResult = results.filter((result) => {
      if (submissionStatus == SubmissionStatusEnum.UNSUBMITTED) {
        return !result.submission;
      } else if (submissionStatus == SubmissionStatusEnum.SUBMITTED_LATE) {
        return (
          result.submission && result.submission.updatedAt > deadline.dueBy
        );
      } else if (submissionStatus == SubmissionStatusEnum.SUBMITTED) {
        return result.submission;
      }
    });
    return filteredResult;
  }
}
