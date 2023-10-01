import {
  AchievementLevel,
  Answer,
  ApplicationStatus,
  DeadlineType,
} from "@prisma/client";
import { SkylabError } from "../errors/SkylabError";
import { createUniqueAnswer } from "../models/answers.db";
import {
  findFirstDeadline,
  findUniqueDeadline,
  findUniqueDeadlineWithQuestionsData,
} from "../models/deadline.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { parseQuestionsInput } from "./deadline.helper";
import {
  deleteUniqueApplication,
  findManyApplicationsWithFilter,
  findUniqueApplication,
  updateUniqueApplication,
} from "../models/applications.db";
import { createUniqueSubmission } from "../models/submissions.db";
import { createManyUsersWithStudentRole } from "./students.helper";
import {
  isValidEmail,
  isValidMatriculationNumber,
  isValidNusnetId,
} from "./users.helper";

export async function getAllSubmissionsForLatestApplicationWithFilter(query: {
  limit?: string;
  page?: string;
  search?: string;
  achievement?: AchievementLevel;
  status?: ApplicationStatus;
}) {
  const { page, limit, search, achievement, status } = query;
  const latestApplicationDeadline = await getLatestApplicationDeadline();

  const applications = await findManyApplicationsWithFilter({
    whereQuery: {
      deadlineId: latestApplicationDeadline.id,
      application: {
        teamName: search
          ? { contains: search, mode: "insensitive" }
          : undefined,
        achievement,
        status,
      },
    },
    page: Number(page),
    limit: Number(limit),
  });

  return applications;
}

export async function getLatestApplication() {
  const latestApplicationDeadline = await getLatestApplicationDeadline();

  const latestApplicationDeadlineWithQuestionData =
    await findUniqueDeadlineWithQuestionsData({
      where: { id: latestApplicationDeadline.id },
    });

  const { sections, ...deadlineData } =
    latestApplicationDeadlineWithQuestionData;

  return {
    deadline: deadlineData,
    sections: sections.map((section) => {
      const { questions, ...sectionData } = section;
      return {
        ...sectionData,
        questions: parseQuestionsInput(questions),
      };
    }),
  };
}

export async function createOneApplicationSubmission(body: {
  submission: {
    deadlineId: number;
    answers: Omit<Answer, "submissionId">[];
  };
}) {
  const { submission } = body;
  const { deadlineId, answers } = submission;

  if (answers.length < 10) {
    throw new SkylabError(
      "Application form does not have sufficient questions to track students' particulars",
      HttpStatusCode.BAD_REQUEST
    );
  }

  // the first 10 questions in an application form should be in this order to track students' particulars, enforced in createDeadline function
  const [
    student1Name,
    student2Name,
    student1Email,
    student2Email,
    student1MatricNo,
    student2MatricNo,
    student1NusnetId,
    student2NusnetId,
    teamName,
    achievement,
  ] = answers.sort((a, b) => a.questionId - b.questionId).map((x) => x.answer);

  if (!isValidEmail(student1Email)) {
    throw new SkylabError(
      "Student 1 Email is invalid",
      HttpStatusCode.BAD_REQUEST
    );
  }

  if (!isValidEmail(student2Email)) {
    throw new SkylabError(
      "Student 2 Email is invalid",
      HttpStatusCode.BAD_REQUEST
    );
  }

  if (!isValidMatriculationNumber(student1MatricNo)) {
    throw new SkylabError(
      "Student 1 Matriculation Number is invalid",
      HttpStatusCode.BAD_REQUEST
    );
  }

  if (!isValidMatriculationNumber(student2MatricNo)) {
    throw new SkylabError(
      "Student 2 Matriculation Number is invalid",
      HttpStatusCode.BAD_REQUEST
    );
  }

  if (!isValidNusnetId(student1NusnetId)) {
    throw new SkylabError(
      "Student 1 NUSNET ID is invalid",
      HttpStatusCode.BAD_REQUEST
    );
  }

  if (!isValidNusnetId(student2NusnetId)) {
    throw new SkylabError(
      "Student 2 NUSNET ID is invalid",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const createdApplication = await createUniqueSubmission({
    data: {
      deadline: {
        connect: {
          id: deadlineId,
        },
      },
      application: {
        create: {
          teamName,
          achievement: achievement as AchievementLevel,
          status: ApplicationStatus.Unprocessed,
          applicants: {
            createMany: {
              data: [
                {
                  name: student1Name,
                  email: student1Email,
                  nusnetId: student1NusnetId.toUpperCase(),
                  matricNo: student1MatricNo.toUpperCase(),
                  deadlineId,
                },
                {
                  name: student2Name,
                  email: student2Email,
                  nusnetId: student2NusnetId.toUpperCase(),
                  matricNo: student2MatricNo.toUpperCase(),
                  deadlineId,
                },
              ],
            },
          },
        },
      },
    },
  });

  if (!answers) {
    return createdApplication;
  }

  const createdAnswers = await Promise.all(
    answers.map(async ({ questionId, answer }) => {
      return await createUniqueAnswer({
        data: {
          submission: { connect: { id: createdApplication.id } },
          question: { connect: { id: questionId } },
          answer: answer,
        },
      });
    })
  );

  return {
    ...createdApplication,
    answers: createdAnswers,
  };
}

const getLatestApplicationDeadline = async () => {
  const latestApplicationDeadline = await findFirstDeadline({
    where: {
      type: DeadlineType.Application,
      dueBy: {
        gte: new Date(),
      },
      cohort: {
        startDate: {
          lt: new Date(),
        },
        endDate: {
          gte: new Date(),
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!latestApplicationDeadline) {
    throw new SkylabError(
      "No Ongoing Application for Orbital",
      HttpStatusCode.BAD_REQUEST
    );
  }

  return latestApplicationDeadline;
};

export async function withdrawOneApplication(applicationSubmissionId: number) {
  await blockActionIfApplicationIsApproved(applicationSubmissionId);

  const withdrawnApplication = await deleteUniqueApplication({
    where: { submissionId: applicationSubmissionId },
  });

  return withdrawnApplication;
}

export async function rejectOneApplication(applicationSubmissionId: number) {
  await blockActionIfApplicationIsApproved(applicationSubmissionId);

  const rejectedApplication = await updateUniqueApplication({
    where: {
      submissionId: applicationSubmissionId,
    },
    data: {
      status: ApplicationStatus.Rejected,
    },
  });

  return rejectedApplication;
}

export async function approveOneApplication(applicationSubmissionId: number) {
  await blockActionIfApplicationIsRejected(applicationSubmissionId);

  const applicationToApprove = await findUniqueApplication({
    where: { submissionId: applicationSubmissionId },
  });

  if (!applicationToApprove) {
    throw new SkylabError(
      "Application submission not found",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const { teamName, achievement, applicants } = applicationToApprove;
  const [applicant1, applicant2] = applicants;

  const { cohortYear } = await findUniqueDeadline({
    where: { id: applicant1.deadlineId },
  });

  const students = [applicant1, applicant2].map(
    ({ matricNo, nusnetId, name, email }) => {
      return {
        student: {
          matricNo,
          nusnetId,
          cohortYear,
        },
        user: {
          name,
          email,
        },
      };
    }
  );

  const errors = await createManyUsersWithStudentRole({
    count: 1,
    projects: [
      {
        name: teamName,
        teamName,
        achievement,
        students,
        cohortYear,
      },
    ],
  });

  if (errors.length) {
    throw new SkylabError(errors, HttpStatusCode.BAD_REQUEST);
  }

  const approvedApplication = await updateUniqueApplication({
    where: {
      submissionId: applicationSubmissionId,
    },
    data: {
      status: ApplicationStatus.Approved,
    },
  });

  console.log("approved", approvedApplication);
  return approvedApplication;
}

async function blockActionIfApplicationIsApproved(
  applicationSubmissionId: number
) {
  const application = await findUniqueApplication({
    where: { submissionId: applicationSubmissionId },
  });

  if (!application) {
    throw new SkylabError("Application not found", HttpStatusCode.BAD_REQUEST);
  }

  if (application.status === ApplicationStatus.Approved) {
    throw new SkylabError(
      "This application has already been approved",
      HttpStatusCode.BAD_REQUEST
    );
  }

  return;
}

async function blockActionIfApplicationIsRejected(
  applicationSubmissionId: number
) {
  const application = await findUniqueApplication({
    where: { submissionId: applicationSubmissionId },
  });

  if (!application) {
    throw new SkylabError("Application not found", HttpStatusCode.BAD_REQUEST);
  }

  if (application.status === ApplicationStatus.Rejected) {
    throw new SkylabError(
      "This application has already been rejected",
      HttpStatusCode.BAD_REQUEST
    );
  }

  return;
}
