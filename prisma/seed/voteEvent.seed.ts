import { DisplayType, type PrismaClient } from "@prisma/client";
import { DEFAULT_RESULTS_FILTER } from "../../src/helpers/voteEvent.helper";

export const seedVoteEvent = async (prisma: PrismaClient) => {
  const today = new Date();
  const yesterday = new Date();
  const tomorrow = new Date();
  const nextYear = new Date();
  yesterday.setDate(today.getDate() - 1);
  tomorrow.setDate(today.getDate() + 1);
  nextYear.setFullYear(today.getFullYear() + 1);

  const voterManagement = {
    hasInternalList: true,
    hasExternalList: true,
    isRegistrationOpen: false,
  };

  const voteConfig = {
    maxVotes: 3,
    minVotes: 1,
    isRandomOrder: false,
    instructions: "Please vote for your favorite projects.",
    displayType: "Table" as DisplayType,
  };

  const voteEventData = [
    {
      title: "Newly created incomplete Vote Event",
      startTime: tomorrow,
      endTime: nextYear,
      resultsFilter: { create: DEFAULT_RESULTS_FILTER },
    },
    {
      title: "Vote Event with only voter management set",
      startTime: tomorrow,
      endTime: nextYear,
      voterManagement: {
        create: voterManagement,
      },
      resultsFilter: { create: DEFAULT_RESULTS_FILTER },
    },
    {
      title: "Vote Event with only vote config set",
      startTime: tomorrow,
      endTime: nextYear,
      voteConfig: {
        create: voteConfig,
      },
      resultsFilter: { create: DEFAULT_RESULTS_FILTER },
    },
    {
      title: "vote event with results published",
      startTime: yesterday,
      endTime: today,
      voterManagement: {
        create: voterManagement,
      },
      voteConfig: {
        create: voteConfig,
      },
      resultsFilter: {
        create: { ...DEFAULT_RESULTS_FILTER, areResultsPublished: true },
      },
    },
    {
      title: "vote event with results published (no votes)",
      startTime: yesterday,
      endTime: nextYear,
      voterManagement: {
        create: voterManagement,
      },
      voteConfig: {
        create: voteConfig,
      },
      resultsFilter: {
        create: { ...DEFAULT_RESULTS_FILTER, areResultsPublished: true },
      },
    },
    {
      title: "vote event with results not published",
      startTime: yesterday,
      endTime: nextYear,
      voterManagement: {
        create: voterManagement,
      },
      voteConfig: {
        create: voteConfig,
      },
      resultsFilter: {
        create: DEFAULT_RESULTS_FILTER,
      },
    },
  ];

  const voteEventsWithVoters = [
    "vote event with results published",
    "vote event with results published (no votes)",
    "vote event with results not published",
  ];

  const voteEventWithCandidates = [
    "vote event with results published",
    "vote event with results published (no votes)",
    "vote event with results not published",
  ];

  const voteEventWithVotes = [
    "vote event with results published",
    "vote event with results not published",
  ];

  const idMap = {};

  // Create vote events
  for (const voteEvent of voteEventData) {
    const newVoteEvent = await prisma.voteEvent.create({
      data: { ...voteEvent },
    });

    idMap[voteEvent.title] = newVoteEvent.id;
  }

  // Add voters to vote events
  const externalVoterId = "externalId123";
  const userIds = await prisma.user.findMany({
    select: { id: true },
  });

  for (const voteEvent of voteEventsWithVoters) {
    await prisma.voteEvent.update({
      where: { id: idMap[voteEvent] },
      data: {
        internalVoters: {
          connect: [...userIds],
        },
        externalVoters: {
          create: { id: externalVoterId },
        },
      },
    });
  }

  // Add candidates to vote events
  const projectIds = await prisma.project.findMany({
    select: { id: true },
  });

  for (const voteEvent of voteEventWithCandidates) {
    await prisma.voteEvent.update({
      where: { id: idMap[voteEvent] },
      data: {
        candidates: {
          connect: [...projectIds],
        },
      },
    });
  }

  // Add votes to vote events
  const student = await prisma.user.findFirst({ where: { name: "Student" } });
  if (!student) {
    throw new Error("Students not seeded correctly");
  }

  const adviser = await prisma.user.findFirst({ where: { name: "Adviser" } });
  if (!adviser) {
    throw new Error("Advisers not seeded correctly");
  }

  const mentor = await prisma.user.findFirst({ where: { name: "Mentor" } });
  if (!mentor) {
    throw new Error("Mentors not seeded correctly");
  }

  const administrator = await prisma.user.findFirst({
    where: { name: "Admin" },
  });
  if (!administrator) {
    throw new Error("Administrators not seeded correctly");
  }

  for (const voteEvent of voteEventWithVotes) {
    const votes = [
      {
        userId: student.id,
        voteEventId: idMap[voteEvent],
        projectId: 1,
      },
      {
        userId: student.id,
        voteEventId: idMap[voteEvent],
        projectId: 2,
      },
      {
        userId: student.id,
        voteEventId: idMap[voteEvent],
        projectId: 3,
      },
      {
        userId: adviser.id,
        voteEventId: idMap[voteEvent],
        projectId: 1,
      },
      {
        userId: mentor.id,
        voteEventId: idMap[voteEvent],
        projectId: 1,
      },
      {
        userId: administrator.id,
        voteEventId: idMap[voteEvent],
        projectId: 1,
      },
      {
        externalVoterId: externalVoterId,
        voteEventId: idMap[voteEvent],
        projectId: 1,
      },
    ];

    await prisma.vote.createMany({
      data: votes,
    });
  }
};
