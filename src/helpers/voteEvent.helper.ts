/* eslint-disable @typescript-eslint/no-explicit-any */
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

  const updatedUser = await updateUniqueUser({
    where: { email: email },
    data: {
      voteEvents: {
        connect: { id: voteEventId },
      },
    },
  });

  if (!updatedUser) {
    throw new SkylabError(
      "Error occurred while adding internal voter",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
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
  const externalVoter = await createExternalVoter({
    data: {
      id: voterId,
      voteEventId: voteEventId,
    },
  });

  if (!externalVoter) {
    throw new SkylabError(
      "Error occurred while adding external voter",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  return externalVoter;
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
