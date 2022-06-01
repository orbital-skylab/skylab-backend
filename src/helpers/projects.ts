import { Project } from "@prisma/client";
import { SkylabError } from "src/errors/SkylabError";
import { getCurrentCohort } from "src/models/cohorts.db";
import { createProject } from "src/models/projects.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

export const createProjectHelper = async (
  projectInfo: Omit<Project, "cohortId">
) => {
  const latestCohort = await getCurrentCohort();
  if (!latestCohort) {
    throw new SkylabError(
      "No cohort exists to add project to",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
  const cohortId = latestCohort.id;
  await createProject({
    ...projectInfo,
    cohort: { connect: { id: cohortId } },
  });
};
