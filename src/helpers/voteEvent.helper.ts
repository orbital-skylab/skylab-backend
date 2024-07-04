/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AchievementLevel,
  Administrator,
  Adviser,
  Mentor,
  Project,
  Student,
  User,
} from "@prisma/client";
import { prisma } from "../client";
import { SkylabError } from "../errors/SkylabError";
import { findManyProjects, updateOneProject } from "../models/projects.db";
import { findManyUsers, updateUniqueUser } from "../models/users.db";
import {
  createExternalVoter,
  createManyVotes,
  createOneVoteEvent,
  deleteExternalVoter,
  deleteVoteEvent,
  findManyExternalVoters,
  findManyVoteEvents,
  findManyVotes,
  findUniqueVoteEvent,
  updateVoteEvent,
} from "../models/voteEvent.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { removePasswordFromUser } from "src/helpers/users.helper";

export const VOTE_EVENT_INCLUSION = {
  // TODO: include what is needed as features are added
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
};

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
};

const processEditVoteEventData = (voteEvent: any) => {
  let data = {
    ...voteEvent,
    voterManagement: undefined,
    voteConfig: undefined,
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
  const users: (User & {
    student?: Student[];
    mentor?: Mentor[];
    administrator?: Administrator[];
    adviser?: Adviser[];
  })[] = await findManyUsers({
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
    const { student, mentor, administrator, adviser, ...userInfo } = user;
    const userInfoWithoutPassword = removePasswordFromUser(userInfo);
    return {
      ...userInfoWithoutPassword,
      student: student ? student[0] ?? {} : {},
      mentor: mentor ? mentor[0] ?? {} : {},
      adviser: adviser ? adviser[0] ?? {} : undefined,
      administrator: administrator ? administrator[0] ?? {} : undefined,
    };
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

  // check if user is already part of vote event
  const user = await findManyUsers({
    where: { email, voteEvents: { some: { id: voteEventId } } },
  });

  if (user.length > 0) {
    throw new SkylabError(
      "User is already part of the vote event",
      HttpStatusCode.BAD_REQUEST
    );
  }

  let updatedUser: User;

  try {
    updatedUser = await updateUniqueUser({
      where: { email: email },
      data: {
        voteEvents: {
          connect: { id: voteEventId },
        },
      },
    });
  } catch (e) {
    if (e.code === "P2016") {
      throw new SkylabError(
        "There is no user with that email address",
        HttpStatusCode.BAD_REQUEST
      );
    } else {
      throw e;
    }
  }

  return updatedUser;
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

  if (!cohort || !achievement) {
    throw new SkylabError(
      "Invalid request body",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

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
  if (!userId && !externalVoterId) {
    throw new SkylabError(
      "You are not authorized to vote in this event",
      HttpStatusCode.UNAUTHORIZED
    );
  }

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

// --- Transaction Helper Functions ---

export async function editVoterManagement({
  body,
  voteEventId,
}: {
  body: {
    voteEvent: any;
  };
  voteEventId: number;
}) {
  const { voteEvent } = body;

  return await prisma.$transaction(async (tx) => {
    const updatedVoteEvent = await tx.voteEvent.update({
      where: { id: voteEventId },
      data: processEditVoteEventData(voteEvent),
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
    await tx.voteEvent.update({
      where: { id: voteEventId },
      data: {
        externalVoters: {
          deleteMany: {},
        },
      },
    });
    return updatedVoteEvent;
  });
}
