import { AchievementLevel } from "@prisma/client";
import { prisma } from "../client";
import { userLogin } from "../helpers/authentication.helper";
import app from "../server";
import supertest from "supertest";
import {
  MOCK_PROJECT_1,
  MOCK_PROJECT_2,
  MOCK_VOTE_EVENT_1,
  MOCK_VOTE_EVENT_2,
  VOTER_ID_1,
  VOTER_ID_2,
} from "../../__mocks__/voteEvent.mocks";

export const KNOWN_EMAILS = [
  "student@skylab.com",
  "adviser@skylab.com",
  "mentor@skylab.com",
  "admin@skylab.com",
];

export async function voteEventTestSetUp() {
  await prisma.voteEvent.deleteMany();

  const voteEvent1 = await prisma.voteEvent.create({
    data: MOCK_VOTE_EVENT_1,
  });

  const voteEvent2 = await prisma.voteEvent.create({
    data: MOCK_VOTE_EVENT_2,
  });

  for (const email of KNOWN_EMAILS) {
    await prisma.user.update({
      where: { email: email },
      data: {
        voteEvents: {
          connect: { id: voteEvent1.id },
        },
      },
    });
  }

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

  return {
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

export const voteEventTestTearDown = async () => {
  await prisma.voteEvent.deleteMany();
  await prisma.project.delete({
    where: {
      teamName_cohortYear: {
        teamName: MOCK_PROJECT_1.teamName,
        cohortYear: MOCK_PROJECT_1.cohortYear,
      },
    },
  });
  await prisma.project.delete({
    where: {
      teamName_cohortYear: {
        teamName: MOCK_PROJECT_2.teamName,
        cohortYear: MOCK_PROJECT_2.cohortYear,
      },
    },
  });
};
