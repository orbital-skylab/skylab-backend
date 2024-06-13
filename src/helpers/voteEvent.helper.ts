/* eslint-disable @typescript-eslint/no-explicit-any */
import { AchievementLevel, User } from "@prisma/client";
import { findManyProjects, updateOneProject } from "../models/projects.db";
import { prisma } from "../client";
import { SkylabError } from "../errors/SkylabError";
import { findManyUsers, updateUniqueUser } from "../models/users.db";
import {
  createExternalVoter,
  createOneVoteEvent,
  deleteExternalVoter,
  deleteVoteEvent,
  findManyExternalVoters,
  findManyVoteEvents,
  findUniqueVoteEvent,
  updateVoteEvent,
} from "../models/voteEvent.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";

export const VOTE_EVENT_INCLUSION = {
  // TODO: include what is needed as features are added
  voterManagement: {
    select: {
      hasInternalList: true,
      hasRegistration: true,
      hasInternalCsvImport: true,
      hasExternalList: true,
      hasGeneration: true,
      hasExternalCsvImport: true,
      isRegistrationOpen: true,
    },
  },
};

const processEditVoteEventData = (voteEvent: any) => {
  let data = {
    ...voteEvent,
  };

  if (voteEvent.voterManagement) {
    data = {
      ...voteEvent,
      voterManagement: {
        upsert: {
          create: {
            ...voteEvent.voterManagement,
          },
          update: {
            ...voteEvent.voterManagement,
          },
        },
      },
    };
  }

  return data;
};

// --- Vote Event Helper Functions ---

export async function getAllVoteEvents() {
  const voteEvents = await findManyVoteEvents({});

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

  if (!voteEvent) {
    throw new SkylabError(
      "Error occurred while creating vote event",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

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

  if (!updatedVoteEvent) {
    throw new SkylabError(
      "Error occurred while updating vote event",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  return updatedVoteEvent;
}

export async function removeVoteEvent(voteEventId: number) {
  const deletedVoteEvent = await deleteVoteEvent({
    where: { id: voteEventId },
  });

  if (!deletedVoteEvent) {
    throw new SkylabError(
      "Error occurred while deleting vote event",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  return deletedVoteEvent;
}

// --- Internal Voter Helper Functions ---

export async function getAllInternalVotersByVoteEvent(voteEventId: number) {
  const users = await findManyUsers({
    where: { voteEvents: { some: { id: voteEventId } } },
  });
  return users;
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

  //check if user is already part of vote event
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

  if (!updatedUser) {
    throw new SkylabError(
      "Error occurred while removing internal voter",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

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

  if (!newExternalVoter) {
    throw new SkylabError(
      "Error occurred while adding external voter",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

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

  if (!deletedExternalVoter) {
    throw new SkylabError(
      "Error occurred while deleting external voter",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

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

  let updatedProject;

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
    achievement === "all"
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
