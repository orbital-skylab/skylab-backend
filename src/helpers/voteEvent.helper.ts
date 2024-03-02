import { SkylabError } from "../errors/SkylabError";
import {
  createOneVoteEvent,
  deleteVoteEvent,
  findManyVoteEvents,
  updateVoteEvent,
} from "../models/voteEvent.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";

export async function getAllVoteEvents() {
  const voteEvents = await findManyVoteEvents({});

  // TODO: include a set of fields
  return voteEvents;
}

export async function createInitialVoteEvent() {
  const voteEvent = await createOneVoteEvent({
    data: {
      title: "Vote Event",
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
    title: string;
  };
  voteEventId: number;
}) {
  const voteEvent = await updateVoteEvent({
    where: { id: voteEventId },
    data: {
      title: body.title,
    },
  });

  if (!voteEvent) {
    throw new SkylabError(
      "Error occurred while updating vote event",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  return voteEvent;
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
