/* eslint-disable @typescript-eslint/no-explicit-any */
import { SkylabError } from "src/errors/SkylabError";
import { createDeadline } from "src/models/deadline.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

export const createDeadlineHelper = async (body: any) => {
  const { deadline } = body;

  if (
    !deadline ||
    !(deadline.cohortYear && deadline.name && deadline.dueBy && deadline.type)
  ) {
    throw new SkylabError(
      "Data missing from request body",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const { cohortYear, ...deadlineData } = deadline;

  try {
    return await createDeadline(deadlineData, Number(cohortYear));
  } catch (e) {
    if (!(e instanceof SkylabError)) {
      throw new SkylabError(e.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    } else {
      throw e;
    }
  }
};
