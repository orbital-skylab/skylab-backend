/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { AchievementLevel } from "@prisma/client";
import {
  MOCK_SUBMISSION,
  MOCK_PROJECT_WITH_SUBMISSION,
  MOCK_PROJECT_WITHOUT_SUBMISSION,
} from "../../__mocks__/dashboard.admin.mocks";
import * as DashboardAdminHelpers from "../../src/helpers/dashboard.admin.helper";
import {
  flattenProjectUsers,
  getSubmissions,
  getSubmissionsByDeadlineId,
  SubmissionStatusEnum,
} from "../../src/helpers/dashboard.admin.helper";
import * as DeadlineDb from "../../src/models/deadline.db";
import * as ProjectsDb from "../../src/models/projects.db";
import * as SubmissionsDb from "../../src/models/submissions.db";

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

describe("flattenProjectUsers function unit test", () => {
  it("should flatten project users correctly", () => {
    const projectData = {
      id: 37,
      name: "mountainous instructor",
      teamName: "Team deadly damage",
      adviserId: 37,
      mentorId: 37,
      achievement: AchievementLevel.Vostok as AchievementLevel,
      cohortYear: 2025,
      proposalPdf: "http://pretty-mast.org",
      posterUrl: "https://loremflickr.com/640/480",
      videoUrl: null,
      hasDropped: false,
      students: [
        {
          id: 37,
          userId: 37,
          projectId: 37,
          nusnetId: "e0612289",
          matricNo: "A0595212C",
          cohortYear: 2025,
          user: {
            id: 37,
            name: "Student One",
            email: "student1@example.com",
            profilePicUrl: "https://loremflickr.com/640/480",
            githubUrl: "http://example1.com",
            linkedinUrl: "http://example1.com",
            personalSiteUrl: "http://student1.com",
            selfIntro: "I am a student.",
            password: "password123",
            submitterId: null,
          },
        },
        {
          id: 364,
          userId: 364,
          projectId: 37,
          nusnetId: "e0368678",
          matricNo: "A0460516R",
          cohortYear: 2025,
          user: {
            id: 364,
            name: "Student Two",
            email: "student2@example.com",
            profilePicUrl: "https://loremflickr.com/640/480",
            githubUrl: "http://example2.com",
            linkedinUrl: "http://example2.com",
            personalSiteUrl: "http://student2.com",
            selfIntro: "I am a student.",
            password: "password456",
            submitterId: null,
          },
        },
      ],
      mentor: {
        id: 37,
        userId: 539,
        cohortYear: 2025,
        user: {
          id: 539,
          name: "Mireille Bernhard",
          email: "Mireille73@hotmail.com",
          profilePicUrl: "https://loremflickr.com/640/480",
          githubUrl: "https://puny-flute.info",
          linkedinUrl: "https://tepid-girlfriend.info",
          personalSiteUrl: "http://surprised-fighter.info",
          selfIntro:
            "Inventore itaque quia in nihil inventore necessitatibus qui dolorem.",
          password:
            "$2b$10$HGuZuxtbSGyeqYiJJUsTUucrBe7lltBOS7sBAD.L7GswYaybNVAfy",
          submitterId: null,
        },
      },
      adviser: {
        id: 37,
        userId: 439,
        nusnetId: "e0982508",
        matricNo: "A0622992K",
        cohortYear: 2025,
        user: {
          id: 439,
          name: "Meggie Terry",
          email: "Meggie_Terry3764@yahoo.com",
          profilePicUrl: "https://loremflickr.com/640/480",
          githubUrl: "http://fitting-sampan.info",
          linkedinUrl: "https://spanish-ox.biz",
          personalSiteUrl: "https://courteous-manufacturer.net",
          selfIntro: "Ullam et maiores et.",
          password:
            "$2b$10$S7uTybsVhvg708adHmzI../rc5mqOJSTV/8fKbMltXSVmBjLGucTm",
          submitterId: null,
        },
      },
    };

    const expectedFlattened = {
      adviser: {
        adviserId: 37,
        id: 439,
        userId: 439,
        submitterId: null,
        matricNo: "A0622992K",
        nusnetId: "e0982508",
        cohortYear: 2025,
        name: "Meggie Terry",
        email: "Meggie_Terry3764@yahoo.com",
        profilePicUrl: "https://loremflickr.com/640/480",
        githubUrl: "http://fitting-sampan.info",
        linkedinUrl: "https://spanish-ox.biz",
        personalSiteUrl: "https://courteous-manufacturer.net",
        selfIntro: "Ullam et maiores et.",
      },
      mentor: {
        mentorId: 37,
        id: 539,
        userId: 539,
        cohortYear: 2025,
        name: "Mireille Bernhard",
        email: "Mireille73@hotmail.com",
        profilePicUrl: "https://loremflickr.com/640/480",
        githubUrl: "https://puny-flute.info",
        linkedinUrl: "https://tepid-girlfriend.info",
        personalSiteUrl: "http://surprised-fighter.info",
        selfIntro:
          "Inventore itaque quia in nihil inventore necessitatibus qui dolorem.",
        submitterId: null,
      },
      id: 37,
      name: "mountainous instructor",
      teamName: "Team deadly damage",
      adviserId: 37,
      mentorId: 37,
      achievement: AchievementLevel.Vostok as AchievementLevel,
      cohortYear: 2025,
      proposalPdf: "http://pretty-mast.org",
      posterUrl: "https://loremflickr.com/640/480",
      videoUrl: null,
      hasDropped: false,
      students: [
        {
          id: 37,
          studentId: 37,
          userId: 37,
          projectId: 37,
          nusnetId: "e0612289",
          matricNo: "A0595212C",
          cohortYear: 2025,
          name: "Student One",
          email: "student1@example.com",
          profilePicUrl: "https://loremflickr.com/640/480",
          githubUrl: "http://example1.com",
          linkedinUrl: "http://example1.com",
          personalSiteUrl: "http://student1.com",
          selfIntro: "I am a student.",
          submitterId: null,
        },
        {
          id: 364,
          studentId: 364,
          userId: 364,
          projectId: 37,
          nusnetId: "e0368678",
          matricNo: "A0460516R",
          cohortYear: 2025,
          name: "Student Two",
          email: "student2@example.com",
          profilePicUrl: "https://loremflickr.com/640/480",
          githubUrl: "http://example2.com",
          linkedinUrl: "http://example2.com",
          personalSiteUrl: "http://student2.com",
          selfIntro: "I am a student.",
          submitterId: null,
        },
      ],
    };

    const flattenedProject = flattenProjectUsers(projectData);
    expect(flattenedProject).toEqual(expectedFlattened);
  });
});

// --- Dashboard Admin Helper Functions Tests ---

describe("getSubmissions helper unit test", () => {
  let getSubmissionsByDeadlineIdSpy;
  let getAllSubmissionsSpy;

  const mockProjects = [
    {
      id: MOCK_PROJECT_WITH_SUBMISSION.fromProject.id,
      updatedAt: new Date("2025-02-01T05:30:08.436Z"),
      ...MOCK_PROJECT_WITH_SUBMISSION,
    },
    {
      id: MOCK_PROJECT_WITHOUT_SUBMISSION.fromProject.id,
      updatedAt: new Date("2025-02-01T05:30:08.436Z"),
      ...MOCK_PROJECT_WITHOUT_SUBMISSION,
    },
  ];

  beforeAll(() => {
    getAllSubmissionsSpy = jest.spyOn(
      DashboardAdminHelpers,
      "getAllSubmissions"
    );
    getSubmissionsByDeadlineIdSpy = jest.spyOn(
      DashboardAdminHelpers,
      "getSubmissionsByDeadlineId"
    );
  });

  it("should return all submissions", async () => {
    getAllSubmissionsSpy.mockResolvedValueOnce(mockProjects);
    getSubmissionsByDeadlineIdSpy.mockResolvedValueOnce([]);

    const result = await getSubmissions(MOCK_SUBMISSION);

    expect(getAllSubmissionsSpy).toHaveBeenCalledTimes(1);
    expect(getAllSubmissionsSpy).toHaveBeenCalledWith(MOCK_SUBMISSION);
    expect(getSubmissionsByDeadlineIdSpy).not.toHaveBeenCalled();

    expect(result).toEqual(mockProjects);
  });
});

describe("getSubmissionsByDeadlineId helper unit test", () => {
  const buildProject = (id: number, hasDropped = false) =>
    ({
      id,
      name: `Project ${id}`,
      teamName: `Team ${id}`,
      adviserId: null,
      mentorId: null,
      achievement: AchievementLevel.Vostok,
      cohortYear: 2025,
      proposalPdf: null,
      posterUrl: null,
      videoUrl: null,
      hasDropped,
      students: [],
      adviser: null,
      mentor: null,
    } as any);

  const buildSubmission = (projectId: number) =>
    ({
      id: projectId,
      deadlineId: 1,
      isDraft: false,
      updatedAt: new Date("2025-01-01T00:00:00.000Z"),
      fromProjectId: projectId,
      toProjectId: null,
      fromUserId: null,
      toUserId: null,
    } as any);

  it("filters and sorts submissions before paginating with a default first page", async () => {
    const projects = Array.from({ length: 56 }, (_, index) =>
      buildProject(index + 1)
    );
    const findManyProjectsSpy = jest
      .spyOn(ProjectsDb, "findManyProjectsWithUserData")
      .mockResolvedValueOnce(projects);
    const findFirstNonDraftSubmissionSpy = jest
      .spyOn(SubmissionsDb, "findFirstNonDraftSubmission")
      .mockImplementation(async ({ where }: any) => {
        const projectId = where.fromProjectId;
        return projectId <= 50 ? buildSubmission(projectId) : null;
      });

    jest.spyOn(DeadlineDb, "findUniqueDeadline").mockResolvedValueOnce({
      id: 1,
      name: "Milestone 1",
      cohortYear: 2025,
      createdOn: new Date("2025-01-01T00:00:00.000Z"),
      dueBy: new Date("2025-02-01T00:00:00.000Z"),
      desc: null,
      type: "Milestone",
      updatedAt: new Date("2025-01-01T00:00:00.000Z"),
      evaluatingMilestoneId: null,
      evaluatorType: null,
    } as any);

    const result = await getSubmissionsByDeadlineId({
      cohortYear: 2025,
      deadlineId: 1,
      dropped: "false",
      submissionStatus: SubmissionStatusEnum.UNSUBMITTED,
      limit: 2,
    });

    expect(findManyProjectsSpy).toHaveBeenCalledWith({
      where: {
        cohortYear: 2025,
        hasDropped: false,
        name: undefined,
      },
    });
    expect(findFirstNonDraftSubmissionSpy).toHaveBeenCalledTimes(56);
    expect(result.map((submission) => submission.fromProject.id)).toEqual([
      51, 52,
    ]);
  });
});
