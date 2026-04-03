import { AchievementLevel } from "@prisma/client";
import { prisma } from "../client";
import {
  EXTERNAL_VOTER_TOKEN,
  externalVoterLogin,
  userLogin,
} from "../helpers/authentication.helper";
import app from "../server";
import supertest from "supertest";
import {
  MOCK_PROJECT_1,
  MOCK_PROJECT_2,
  MOCK_VOTER_MANAGEMENT,
  MOCK_VOTE_CONFIG,
  MOCK_VOTE_EVENT_1,
  MOCK_VOTE_EVENT_2,
  VOTER_ID_1,
  VOTER_ID_2,
} from "../../__mocks__/voteEvent.mocks";
import { DEFAULT_RESULTS_FILTER } from "../helpers/voteEvent.helper";

export const KNOWN_EMAILS = [
  "student@skylab.com",
  "adviser@skylab.com",
  "mentor@skylab.com",
  "admin@skylab.com",
];

export async function voteEventTestSetUp() {
  await prisma.voteEvent.deleteMany();

  const voteEvent1 = await prisma.voteEvent.create({
    data: {
      ...MOCK_VOTE_EVENT_1,
      resultsFilter: {
        create: { ...DEFAULT_RESULTS_FILTER, areResultsPublished: true },
      },
    },
  });

  await prisma.voteEvent.update({
    where: { id: voteEvent1.id },
    data: {
      voterManagement: {
        create: MOCK_VOTER_MANAGEMENT,
      },
      voteConfig: {
        create: MOCK_VOTE_CONFIG,
      },
    },
  });

  const voteEvent2 = await prisma.voteEvent.create({
    data: {
      ...MOCK_VOTE_EVENT_2,
      resultsFilter: { create: DEFAULT_RESULTS_FILTER },
    },
  });

  const userPromises = KNOWN_EMAILS.map(async (email) => {
    const user = await prisma.user.update({
      where: { email: email },
      data: {
        voteEvents: {
          connect: { id: voteEvent1.id },
        },
      },
    });

    return user.id;
  });

  const userIds = await Promise.all(userPromises);

  await prisma.cohort.upsert({
    where: {
      academicYear: MOCK_PROJECT_1.cohortYear,
    },
    update: {},
    create: {
      academicYear: MOCK_PROJECT_1.cohortYear,
      startDate: new Date(`${MOCK_PROJECT_1.cohortYear}-01-01`),
      endDate: new Date(`${MOCK_PROJECT_1.cohortYear}-12-31`),
    },
  });

  const project1 = await prisma.project.create({
    data: {
      ...MOCK_PROJECT_1,
      achievement: MOCK_PROJECT_1.achievement as AchievementLevel,
      voteEvents: {
        connect: { id: voteEvent1.id },
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      ...MOCK_PROJECT_2,
      achievement: MOCK_PROJECT_2.achievement as AchievementLevel,
      voteEvents: {
        connect: { id: voteEvent1.id },
      },
    },
  });

  await prisma.externalVoter.create({
    data: {
      id: VOTER_ID_1,
      voteEventId: voteEvent1.id,
    },
  });

  await prisma.externalVoter.create({
    data: {
      id: VOTER_ID_2,
      voteEventId: voteEvent1.id,
    },
  });

  await prisma.vote.createMany({
    data: [
      {
        userId: userIds[0],
        projectId: project1.id,
        voteEventId: voteEvent1.id,
      },
      {
        externalVoterId: VOTER_ID_1,
        projectId: project1.id,
        voteEventId: voteEvent1.id,
      },
    ],
  });

  return {
    userIds,
    voteEvent1Id: voteEvent1.id,
    voteEvent2Id: voteEvent2.id,
    mockProject1Id: project1.id,
    mockProject2Id: project2.id,
  };
}

export async function setUpRequestWithAdminAuth() {
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD environment variable not set");
  }
  const { token } = await userLogin(
    "admin@skylab.com",
    process.env.ADMIN_PASSWORD
  );

  return supertest.agent(app).set("Cookie", `token=${token}`);
}

export async function setUpRequestWithStudentAuth() {
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD environment variable not set");
  }
  const { token } = await userLogin(
    "student@skylab.com",
    process.env.ADMIN_PASSWORD
  );

  return supertest.agent(app).set("Cookie", `token=${token}`);
}

export async function setUpRequestWithExternalVoterAuth() {
  const { token } = await externalVoterLogin(VOTER_ID_1);

  return supertest.agent(app).set("Cookie", `${EXTERNAL_VOTER_TOKEN}=${token}`);
}

export const voteEventTestTearDown = async () => {
  await prisma.voteEvent.deleteMany();

  const project1 = await prisma.project.findUnique({
    where: {
      teamName_cohortYear: {
        teamName: MOCK_PROJECT_1.teamName,
        cohortYear: MOCK_PROJECT_1.cohortYear,
      },
    },
  });

  const project2 = await prisma.project.findUnique({
    where: {
      teamName_cohortYear: {
        teamName: MOCK_PROJECT_2.teamName,
        cohortYear: MOCK_PROJECT_2.cohortYear,
      },
    },
  });

  if (project1) {
    await prisma.project.delete({
      where: {
        teamName_cohortYear: {
          teamName: MOCK_PROJECT_1.teamName,
          cohortYear: MOCK_PROJECT_1.cohortYear,
        },
      },
    });
  }

  if (project2) {
    await prisma.project.delete({
      where: {
        teamName_cohortYear: {
          teamName: MOCK_PROJECT_2.teamName,
          cohortYear: MOCK_PROJECT_2.cohortYear,
        },
      },
    });
  }

  await prisma.cohort.deleteMany({
    where: { academicYear: MOCK_PROJECT_1.cohortYear },
  });
};
