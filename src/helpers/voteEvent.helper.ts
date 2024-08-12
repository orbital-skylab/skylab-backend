/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AchievementLevel,
  Administrator,
  Adviser,
  Mentor,
  Project,
  ResultsFilter,
  Student,
  User,
  Vote,
  VoteEvent,
  VoterManagement,
} from "@prisma/client";
import ShortUniqueId from "short-unique-id";
import { prisma } from "../client";
import { SkylabError } from "../errors/SkylabError";
import { formatUserWithRoleData } from "../helpers/users.helper";
import { findManyProjects, updateOneProject } from "../models/projects.db";
import { findManyUsers, updateUniqueUser } from "../models/users.db";
import {
  createExternalVoter,
  createManyExternalVoters,
  createManyVotes,
  createOneVoteEvent,
  deleteExternalVoter,
  deleteVote,
  deleteVoteEvent,
  findManyExternalVoters,
  findManyVoteEvents,
  findManyVotes,
  findUniqueVoteEvent,
  updateVoteEvent,
} from "../models/voteEvent.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";

enum ROLES {
  STUDENTS = "Students",
  ADVISERS = "Advisers",
  MENTORS = "Mentors",
  ADMINISTRATORS = "Administrators",
}

type UserWithRoles = User & {
  student?: Student[];
  mentor?: Mentor[];
  administrator?: Administrator[];
  adviser?: Adviser[];
};

// Fields avaialable for administartors
export const VOTE_EVENT_INCLUSION = {
  voterManagement: {
    select: {
      hasInternalList: true,
      hasExternalList: true,
      isRegistrationOpen: true,
    },
  },
  voteConfig: {
    select: {
      displayType: true,
      minVotes: true,
      maxVotes: true,
      isRandomOrder: true,
      instructions: true,
    },
  },
  resultsFilter: {
    select: {
      areResultsPublished: true,
      displayLimit: true,
      showRank: true,
      showVotes: true,
      showPoints: true,
      showPercentage: true,
      administratorWeight: true,
      adviserWeight: true,
      mentorWeight: true,
      studentWeight: true,
      publicWeight: true,
    },
  },
};

// Fields available for internal and external voters
export const VOTE_EVENT_PUBLIC_INCLUSION = {
  voterManagement: {
    select: {
      isRegistrationOpen: true,
    },
  },
  voteConfig: {
    select: {
      displayType: true,
      minVotes: true,
      maxVotes: true,
      isRandomOrder: true,
      instructions: true,
    },
  },
  resultsFilter: {
    select: {
      areResultsPublished: true,
    },
  },
};

export const DEFAULT_RESULTS_FILTER: Omit<ResultsFilter, "voteEventId"> = {
  areResultsPublished: false,
  displayLimit: 0,
  showRank: true,
  showVotes: true,
  showPoints: true,
  showPercentage: true,
  administratorWeight: 1,
  adviserWeight: 1,
  mentorWeight: 1,
  studentWeight: 1,
  publicWeight: 1,
};

const roleMap: { [key: string]: keyof ResultsFilter } = {
  [ROLES.ADMINISTRATORS]: "administratorWeight",
  [ROLES.MENTORS]: "mentorWeight",
  [ROLES.STUDENTS]: "studentWeight",
  [ROLES.ADVISERS]: "adviserWeight",
};

const userHasRole = (
  user: UserWithRoles | undefined,
  selectedRole: ROLES | ROLES[]
): boolean => {
  if (!user) {
    return false;
  }

  if (Array.isArray(selectedRole)) {
    return Boolean(
      selectedRole.reduce((acc, role) => acc || userHasRole(user, role), false)
    );
  }

  if (
    selectedRole === ROLES.STUDENTS &&
    user.student &&
    user.student[0] &&
    user.student[0].id
  ) {
    return true;
  } else if (
    selectedRole === ROLES.ADVISERS &&
    user.adviser &&
    user.adviser[0] &&
    user.adviser[0].id
  ) {
    return true;
  } else if (
    selectedRole === ROLES.MENTORS &&
    user.mentor &&
    user.mentor[0] &&
    user.mentor[0].id
  ) {
    return true;
  } else if (
    selectedRole === ROLES.ADMINISTRATORS &&
    user.administrator &&
    user.administrator[0] &&
    user.administrator[0].id
  ) {
    return true;
  }

  return false;
};

const getMostImportantRole = (user: User): ROLES => {
  if (userHasRole(user, ROLES.ADMINISTRATORS)) {
    return ROLES.ADMINISTRATORS;
  } else if (userHasRole(user, ROLES.MENTORS)) {
    return ROLES.MENTORS;
  } else if (userHasRole(user, ROLES.ADVISERS)) {
    return ROLES.ADVISERS;
  } else {
    return ROLES.STUDENTS;
  }
};

export const calculateResults = (
  votes: (Vote & { project: Project; internalVoter: UserWithRoles | null })[],
  resultsFilter: ResultsFilter
) => {
  let totalPoints = 0;

  // Calculate the total points and votes for each project
  const results = votes.reduce(
    (acc, vote) => {
      const { projectId, project, internalVoter } = vote;

      const pointsToAdd = internalVoter
        ? (resultsFilter[
            roleMap[getMostImportantRole(internalVoter)]
          ] as number)
        : (resultsFilter["publicWeight"] as number);

      totalPoints += pointsToAdd;

      if (acc[projectId]) {
        acc[projectId].votes++;
        acc[projectId].points += pointsToAdd;
      } else {
        acc[projectId] = {
          project,
          votes: 1,
          points: pointsToAdd,
        };
      }
      return acc;
    },
    {} as Record<
      number,
      {
        project: Project;
        votes: number;
        points: number;
      }
    >
  );

  // Sort the results and calculate the rank and percentage
  const fullResults = Object.values(results)
    .sort((a, b) => b.points - a.points)
    .map((result, idx) => {
      return {
        ...result,
        rank: idx + 1,
        percentage: parseFloat(
          ((result.points / totalPoints) * 100).toFixed(2)
        ),
      };
    });

  // Filter the results based on the results filter
  let filteredResults: {
    rank: number | null;
    percentage: number | null;
    project: Project;
    votes: number | null;
    points: number | null;
  }[] = fullResults;

  if (resultsFilter.displayLimit > 0) {
    filteredResults = fullResults.slice(0, resultsFilter.displayLimit);
  }

  filteredResults = filteredResults.map((result) => {
    return {
      ...result,
      rank: resultsFilter.showRank ? result.rank : null,
      percentage: resultsFilter.showPercentage ? result.percentage : null,
      votes: resultsFilter.showVotes ? result.votes : null,
      points: resultsFilter.showPoints ? result.points : null,
    };
  });

  return filteredResults;
};

const processEditVoteEventData = (voteEvent: any) => {
  let data = {
    ...voteEvent,
    voterManagement: undefined,
    voteConfig: undefined,
    resultsFilter: { update: { ...voteEvent.resultsFilter } },
  };

  if (voteEvent.voterManagement) {
    const voterManagement = voteEvent.voterManagement;

    data = {
      ...data,
      voterManagement: {
        upsert: {
          create: {
            ...voterManagement,
          },
          update: {
            ...voterManagement,
          },
        },
      },
    };
  }

  if (voteEvent.voteConfig) {
    const voteConfig = {
      ...voteEvent.voteConfig,
      minVotes: Number(voteEvent.voteConfig.minVotes),
      maxVotes: Number(voteEvent.voteConfig.maxVotes),
    };

    data = {
      ...data,
      voteConfig: {
        upsert: {
          create: {
            ...voteConfig,
          },
          update: {
            ...voteConfig,
          },
        },
      },
    };
  }

  return data;
};

// --- Vote Event Helper Functions ---

export async function getAllVoteEvents() {
  const voteEvents = await findManyVoteEvents({
    include: VOTE_EVENT_PUBLIC_INCLUSION,
  });

  return voteEvents;
}

export async function getInternalVoterVoteEvents(internalVoterId: number) {
  // Get all vote events that the internal voter is part of
  const voteEvents = await findManyVoteEvents({
    where: { internalVoters: { some: { id: internalVoterId } } },
    include: VOTE_EVENT_PUBLIC_INCLUSION,
  });

  // Get other vote events with registration open
  const openVoteEvents = await findManyVoteEvents({
    where: {
      id: { notIn: voteEvents.map((v) => v.id) },
      voterManagement: { isRegistrationOpen: true },
    },
    include: VOTE_EVENT_PUBLIC_INCLUSION,
  });

  return [
    ...voteEvents.map((voteEvent) => {
      return {
        ...voteEvent,
        voterManagement: {
          isRegistrationOpen: false,
        },
      };
    }),
    ...openVoteEvents,
  ];
}

export async function getExternalVoterVoteEvents(externalVoterId: string) {
  const voteEvents = await findManyVoteEvents({
    where: { externalVoters: { some: { id: externalVoterId } } },
    include: VOTE_EVENT_PUBLIC_INCLUSION,
  });

  return voteEvents.map((voteEvent) => {
    return {
      ...voteEvent,
      voterManagement: {
        isRegistrationOpen: false,
      },
    };
  });
}

export async function getOneVoteEventById(voteEventId: number) {
  const voteEvent = await findUniqueVoteEvent({
    where: { id: voteEventId },
    include: VOTE_EVENT_INCLUSION,
  });

  if (!voteEvent) {
    throw new SkylabError(
      "Vote event was not found",
      HttpStatusCode.BAD_REQUEST
    );
  }

  return voteEvent;
}

export async function createVoteEvent(body: {
  voteEvent: { title: string; startTime: Date; endTime: Date };
}) {
  const { title, startTime, endTime } = body.voteEvent;

  const voteEvent = await createOneVoteEvent({
    data: {
      title: title,
      startTime: startTime,
      endTime: endTime,
      resultsFilter: { create: DEFAULT_RESULTS_FILTER },
    },
  });

  return voteEvent;
}

export async function editVoteEvent({
  body,
  voteEventId,
}: {
  body: {
    voteEvent: any;
  };
  voteEventId: number;
}) {
  const { voteEvent } = body;

  const voteEventToUpdate:
    | (VoteEvent & { voterManagement?: VoterManagement })
    | null = await findUniqueVoteEvent({
    where: { id: voteEventId },
    include: { voterManagement: true },
  });

  if (!voteEventToUpdate) {
    throw new SkylabError(
      "Vote event was not found",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const updatedVoteEvent = await updateVoteEvent({
    where: { id: voteEventId },
    data: processEditVoteEventData(voteEvent),
    include: VOTE_EVENT_INCLUSION,
  });

  return updatedVoteEvent;
}

export async function removeVoteEvent(voteEventId: number) {
  const deletedVoteEvent = await deleteVoteEvent({
    where: { id: voteEventId },
  });

  return deletedVoteEvent;
}

// --- Internal Voter Helper Functions ---

export async function getAllInternalVotersByVoteEvent(voteEventId: number) {
  const users: UserWithRoles[] = await findManyUsers({
    where: { voteEvents: { some: { id: voteEventId } } },
    include: {
      student: true,
      mentor: true,
      administrator: true,
      adviser: true,
    },
  });

  /* Parse Users Objects */
  const parsedUsers = users.map((user) => {
    return formatUserWithRoleData(user);
  });

  return parsedUsers;
}

export async function addInternalVoter({
  body,
  voteEventId,
}: {
  body: {
    email: string;
  };
  voteEventId: number;
}) {
  const { email } = body;

  // check if user exists
  const user = await findManyUsers({
    where: { email },
  });

  if (user.length === 0) {
    throw new SkylabError("User does not exist", HttpStatusCode.BAD_REQUEST);
  }

  // check if user is already part of vote event
  const users = await findManyUsers({
    where: { email, voteEvents: { some: { id: voteEventId } } },
  });

  if (users.length > 0) {
    throw new SkylabError(
      "User is already part of the vote event",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const updatedUser = await updateUniqueUser({
    where: { email: email },
    data: {
      voteEvents: {
        connect: { id: voteEventId },
      },
    },
    include: {
      student: true,
      mentor: true,
      administrator: true,
      adviser: true,
    },
  });

  return formatUserWithRoleData(updatedUser);
}

export async function addManyInternalVoters({
  body,
  voteEventId,
}: {
  body: { emails: string[] };
  voteEventId: number;
}) {
  const { emails } = body;

  // filter duplicate emails
  const uniqueEmails = Array.from(new Set(emails));

  const users = await findManyUsers({
    where: { email: { in: uniqueEmails } },
  });

  if (users.length !== uniqueEmails.length) {
    throw new SkylabError(
      "One or more users do not exist",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const voteEvent: any = await updateVoteEvent({
    where: { id: voteEventId },
    data: {
      internalVoters: {
        connect: users.map((user) => ({ id: user.id })),
      },
    },
    include: {
      internalVoters: {
        include: {
          student: true,
          mentor: true,
          administrator: true,
          adviser: true,
        },
      },
    },
  });

  return voteEvent.internalVoters.map((user: UserWithRoles) =>
    formatUserWithRoleData(user)
  );
}

export async function removeInternalVoter(
  voteEventId: number,
  internalVoterId: number
) {
  const updatedUser = await updateUniqueUser({
    where: { id: internalVoterId },
    data: {
      voteEvents: {
        disconnect: { id: voteEventId },
      },
    },
    include: { voteEvents: true },
  });

  return updatedUser;
}

// --- External Voter Helper Functions ---

export async function getAllExternalVotersByVoteEvent(voteEventId: number) {
  const externalVoters = await findManyExternalVoters({
    where: { voteEventId: voteEventId },
  });

  return externalVoters;
}

export async function addExternalVoter({
  body,
  voteEventId,
}: {
  body: {
    voterId: string;
  };
  voteEventId: number;
}) {
  const { voterId } = body;

  // check if external voter is already part of vote event
  const externalVoter = await findManyExternalVoters({
    where: { id: voterId, voteEventId: voteEventId },
  });

  if (externalVoter.length > 0) {
    throw new SkylabError(
      "External voter is already part of the vote event",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const newExternalVoter = await createExternalVoter({
    data: {
      id: voterId,
      voteEventId: voteEventId,
    },
  });

  return newExternalVoter;
}

export async function addManyExternalVoters({
  body,
  voteEventId,
}: {
  body: { voterIds: string[] };
  voteEventId: number;
}) {
  const { voterIds } = body;

  // filter duplicate voterIds
  const uniqueVoterIds = Array.from(new Set(voterIds));

  const externalVoters = await findManyExternalVoters({
    where: { id: { in: uniqueVoterIds }, voteEventId: voteEventId },
  });

  // filter out external voters that are already part of the vote event
  const newVoterIds = uniqueVoterIds.filter(
    (voterId) =>
      externalVoters.findIndex((voter) => voter.id === voterId) === -1
  );

  await createManyExternalVoters({
    data: newVoterIds.map((voterId) => ({
      id: voterId,
      voteEventId: voteEventId,
    })),
  });

  const allExternalVoters = await findManyExternalVoters({
    where: { voteEventId: voteEventId },
  });

  return allExternalVoters;
}

export async function generateExternalVoters({
  body,
  voteEventId,
}: {
  body: {
    amount: number;
    length: number;
  };
  voteEventId: number;
}) {
  const { amount, length } = body;

  const externalVoters = await findManyExternalVoters({
    where: { voteEventId: voteEventId },
  });

  const existingVoterIds = externalVoters.map((voter) => voter.id);
  const uid = new ShortUniqueId();

  const newVoterIds: string[] = [];

  // generate unique voterIds
  for (let i = 0; i < amount; i++) {
    let newVoterId = (uid as any).rnd(length);
    let attempts = 0;

    // check if voterId is unique
    while (existingVoterIds.includes(newVoterId)) {
      newVoterId = (uid as any).rnd(length);
      attempts++;

      // throw error if unique voterId cannot be generated after 10 attempts
      if (attempts > 10) {
        throw new SkylabError(
          "Could not generate unique voter IDs",
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }
    }

    newVoterIds.push(newVoterId);
    existingVoterIds.push(newVoterId);
  }

  await createManyExternalVoters({
    data: newVoterIds.map((voterId) => ({
      id: voterId,
      voteEventId: voteEventId,
    })),
  });

  const allExternalVoters = await findManyExternalVoters({
    where: { voteEventId: voteEventId },
  });

  return allExternalVoters;
}

export async function removeExternalVoter(
  voteEventId: number,
  externalVoterId: string
) {
  const deletedExternalVoter = await deleteExternalVoter({
    where: {
      id_voteEventId: { id: externalVoterId, voteEventId: voteEventId },
    },
  });

  return deletedExternalVoter;
}

// --- Candidate Helper Functions ---

export async function getAllCandidatesByVoteEvent(voteEventId: number) {
  const candidates = await findManyProjects({
    where: { voteEvents: { some: { id: voteEventId } } },
  });

  return candidates;
}

export async function addCandidate({
  body,
  voteEventId,
}: {
  body: {
    projectId: number;
  };
  voteEventId: number;
}) {
  const { projectId } = body;

  // check if project is already part of vote event
  const project = await findManyProjects({
    where: { id: projectId, voteEvents: { some: { id: voteEventId } } },
  });

  if (project.length > 0) {
    throw new SkylabError(
      "Project is already part of the vote event",
      HttpStatusCode.BAD_REQUEST
    );
  }

  let updatedProject: Project;

  try {
    updatedProject = await updateOneProject({
      where: { id: projectId },
      data: {
        voteEvents: {
          connect: { id: voteEventId },
        },
      },
    });
  } catch (e) {
    if (e.code === "P2016") {
      throw new SkylabError(
        "Project ID does not exist",
        HttpStatusCode.BAD_REQUEST
      );
    } else {
      throw e;
    }
  }

  return updatedProject;
}

export async function addManyCandidates({
  body,
  voteEventId,
}: {
  body: { cohort: number; achievement: string };
  voteEventId: number;
}) {
  const { cohort, achievement } = body;

  const whereQuery =
    achievement === "All"
      ? { cohortYear: cohort }
      : { cohortYear: cohort, achievement: achievement as AchievementLevel };

  const projectsToUpdate = await findManyProjects({
    where: whereQuery,
  });

  const voteEvent: any = await updateVoteEvent({
    where: { id: voteEventId },
    data: {
      candidates: {
        connect: projectsToUpdate.map((project) => ({ id: project.id })),
      },
    },
    include: { candidates: true },
  });

  return voteEvent.candidates;
}

export async function removeCandidate(
  voteEventId: number,
  candidateId: number
) {
  const deletedCandidate = await updateOneProject({
    where: { id: candidateId },
    data: {
      voteEvents: {
        disconnect: { id: voteEventId },
      },
    },
    include: { voteEvents: true },
  });

  return deletedCandidate;
}

// --- Vote Helper Functions ---

export async function getVotesByVoteEventAndVoter(
  voteEventId: number,
  userId?: number,
  externalVoterId?: string
) {
  const votes = await findManyVotes({
    where: {
      voteEventId: voteEventId,
      userId: userId ?? undefined,
      externalVoterId: externalVoterId ?? undefined,
    },
    select: { projectId: true },
  });

  return votes;
}

export async function getAllVotesByVoteEvent(voteEventId: number) {
  const votes: any = await findManyVotes({
    where: {
      voteEventId: voteEventId,
    },
    include: {
      internalVoter: {
        include: {
          student: true,
          mentor: true,
          administrator: true,
          adviser: true,
        },
      },
      project: true,
    },
  });

  const formattedVotes = votes.map((vote) => {
    return {
      ...vote,
      internalVoter: vote.internalVoter
        ? formatUserWithRoleData(vote.internalVoter)
        : null,
    };
  });

  return formattedVotes;
}

export async function addManyVotes({
  body,
  voteEventId,
}: {
  body: {
    userId?: number;
    externalVoterId?: string;
    projectIds: number[];
  };
  voteEventId: number;
}) {
  const { userId, externalVoterId, projectIds } = body;

  if (!userId && !externalVoterId) {
    throw new SkylabError(
      "You are not authorized to vote in this event",
      HttpStatusCode.UNAUTHORIZED
    );
  }

  const existingVotes = await findManyVotes({
    where: {
      voteEventId: voteEventId,
      userId: userId,
      externalVoterId: externalVoterId,
    },
  });

  // check if user has already voted for any of the projects
  if (existingVotes.length > 0) {
    throw new SkylabError(
      "You have already voted in this event",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const voteEvent: any = await findUniqueVoteEvent({
    where: { id: voteEventId },
    include: { voteConfig: true },
  });

  // check if vote event exists
  if (!voteEvent) {
    throw new SkylabError(
      "Vote event does not exist",
      HttpStatusCode.BAD_REQUEST
    );
  }

  // check if voting is open
  if (new Date() < voteEvent.startTime || new Date() > voteEvent.endTime) {
    throw new SkylabError("Vote event is not open", HttpStatusCode.BAD_REQUEST);
  }

  // check if vote event is setup
  if (!voteEvent.voteConfig) {
    throw new SkylabError(
      "Vote event setup is not complete",
      HttpStatusCode.BAD_REQUEST
    );
  }

  // checkif number of votes is within the limit
  if (
    projectIds.length > voteEvent.voteConfig.maxVotes ||
    projectIds.length < voteEvent.voteConfig.minVotes
  ) {
    throw new SkylabError(
      "Number of votes is not within the minimum and maximum limit",
      HttpStatusCode.BAD_REQUEST
    );
  }

  await createManyVotes({
    data: projectIds.map((projectId) => ({
      voteEventId: voteEventId,
      userId: userId,
      externalVoterId: externalVoterId,
      projectId: projectId,
    })),
  });

  const votes = await findManyVotes({
    where: {
      voteEventId: voteEventId,
      userId: userId,
      externalVoterId: externalVoterId,
    },
    select: { projectId: true },
  });

  return votes;
}

export async function removeVote(voteId: number) {
  const deletedVote = await deleteVote({
    where: { id: voteId },
  });

  return deletedVote;
}

// --- Results Helper Functions ---

export async function getResultsByVoteEvent(voteEventId: number) {
  const voteEvent: any = await findUniqueVoteEvent({
    where: { id: voteEventId },
    include: {
      resultsFilter: true,
    },
  });

  if (!voteEvent) {
    throw new SkylabError(
      "Vote event does not exist",
      HttpStatusCode.BAD_REQUEST
    );
  }

  // check if vote event has started
  if (voteEvent.startTime > new Date()) {
    throw new SkylabError(
      "Vote event has not started",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const { resultsFilter } = voteEvent;

  // check if results are published
  if (resultsFilter?.areResultsPublished !== true) {
    throw new SkylabError(
      "Results are not published",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const votes: any = await findManyVotes({
    where: {
      voteEventId: voteEventId,
    },
    include: {
      internalVoter: {
        include: {
          student: true,
          mentor: true,
          administrator: true,
          adviser: true,
        },
      },
      project: true,
    },
  });

  const results = calculateResults(votes, resultsFilter);

  return results;
}

// --- Transaction Helper Functions ---

export async function editVoterManagement({
  body,
  voteEventId,
}: {
  body: {
    voterManagement: Omit<VoterManagement, "voteEventId"> & {
      copyInternalVoteEventId?: number;
      copyExternalVoteEventId?: number;
    };
  };
  voteEventId: number;
}) {
  const { voterManagement } = body;

  return await prisma.$transaction(async (tx) => {
    const updatedVoteEvent = await tx.voteEvent.update({
      where: { id: voteEventId },
      data: {
        voterManagement: {
          upsert: {
            create: {
              hasInternalList: voterManagement.hasInternalList,
              hasExternalList: voterManagement.hasExternalList,
              isRegistrationOpen: voterManagement.isRegistrationOpen,
            },
            update: {
              hasInternalList: voterManagement.hasInternalList,
              hasExternalList: voterManagement.hasExternalList,
              isRegistrationOpen: voterManagement.isRegistrationOpen,
            },
          },
        },
      },
      include: VOTE_EVENT_INCLUSION,
    });
    await tx.voteEvent.update({
      where: { id: voteEventId },
      data: {
        internalVoters: {
          set: [],
        },
      },
    });
    if (voterManagement.copyInternalVoteEventId) {
      const internalVoters = await tx.voteEvent
        .findUnique({
          where: { id: voterManagement.copyInternalVoteEventId },
        })
        .internalVoters();
      await tx.voteEvent.update({
        where: { id: voteEventId },
        data: {
          internalVoters: {
            set: internalVoters,
          },
        },
      });
    }
    await tx.voteEvent.update({
      where: { id: voteEventId },
      data: {
        externalVoters: {
          deleteMany: {},
        },
      },
    });
    if (voterManagement.copyExternalVoteEventId) {
      const externalVoters = await tx.voteEvent
        .findUnique({
          where: { id: voterManagement.copyExternalVoteEventId },
        })
        .externalVoters();
      await tx.voteEvent.update({
        where: { id: voteEventId },
        data: {
          externalVoters: {
            createMany: { data: externalVoters },
          },
        },
      });
    }
    return updatedVoteEvent;
  });
}
