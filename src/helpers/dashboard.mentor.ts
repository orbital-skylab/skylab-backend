import { SkylabError } from "src/errors/SkylabError";
import { findManyDeadlines } from "src/models/deadline.db";
import { findUniqueMentorWithProjectData } from "src/models/mentors.db";
import { findManySubmissions } from "src/models/submissions.db";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

export async function getProjectMilestonesByMentorId(mentorId: number) {
  const mentor = await findUniqueMentorWithProjectData({
    where: { id: mentorId },
  });

  if (mentor.projects.length == 0) {
    throw new SkylabError(
      "This mentor is not in charge of any projects, and hence has no project submissions to view!",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const { cohortYear, projects } = mentor;

  const projectIds = projects.map(({ id }) => id);

  const milestones = await findManyDeadlines({
    where: { cohortYear: cohortYear, type: "Milestone" },
  });

  const projectMilestoneSubmissions = milestones.map(async (milestone) => {
    const submissions = await findManySubmissions({
      where: {
        deadlineId: milestone.id,
        isDraft: false,
        fromProjectId: { in: projectIds },
      },
    });

    return {
      deadline: milestone,
      submissions: submissions,
    };
  });

  return await Promise.all(projectMilestoneSubmissions);
}
