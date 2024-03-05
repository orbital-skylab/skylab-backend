import { SkylabError } from "../errors/SkylabError";
import { updateUniqueUser } from "../models/users.db";
import {
  createExternalVoter,
  createOneVoteEvent,
  deleteExternalVoter,
  deleteVoteEvent,
  findManyExternalVoters,
  findManyVoteEvents,
  findUniqueVoteEvent,
  updateUserAsInternalVoter,
  updateVoteEvent,
  updateVoterManagement,
} from "../models/voteEvent.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";

export async function getAllVoteEvents() {
  const voteEvents = await findManyVoteEvents({});

  return voteEvents;
}

export async function getOneVoteEventById(voteEventId: number) {
  const voteEvent = await findUniqueVoteEvent({
    where: { id: voteEventId },
    include: {
      voterManagement: true,
    },
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
      isRegistrationOpen: false,
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
    voteEvent: {
      title?: string;
      startTime?: Date;
      endTime?: Date;
      isRegistrationOpen?: boolean;
    };
  };
  voteEventId: number;
}) {
  const { voteEvent } = body;

  const updatedVoteEvent = await updateVoteEvent({
    where: { id: voteEventId },
    data: {
      ...voteEvent,
    },
    include: { voterManagement: true },
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
  const updatedUser = await updateUserAsInternalVoter({
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
  });

  if (!updatedUser) {
    throw new SkylabError(
      "Error occurred while updating vote event",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  return updatedUser;
}

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
  const deletedVoteEvent = await deleteExternalVoter({
    where: {
      id_voteEventId: { id: externalVoterId, voteEventId: voteEventId },
    },
  });

  if (!deletedVoteEvent) {
    throw new SkylabError(
      "Error occurred while deleting vote event",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}

export async function editVoterManagement({
  body,
  voteEventId,
}: {
  body: {
    voterManagement: {
      internalList: boolean;
      registration: boolean;
      internalCsvImport: boolean;
      externalList: boolean;
      generation: boolean;
      externalCsvImport: boolean;
    };
  };
  voteEventId: number;
}) {
  const { voterManagement } = body;

  const updatedVoterManagement = await updateVoterManagement({
    where: { voteEventId: voteEventId },
    create: {
      ...voterManagement,
      voteEventId: voteEventId,
    },
    update: {
      ...voterManagement,
    },
  });

  if (!updatedVoterManagement) {
    throw new SkylabError(
      "Error occurred while updating voter management config",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  return updatedVoterManagement;
}
