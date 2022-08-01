import { SkylabError } from "src/errors/SkylabError";
import { findManyDeadlines } from "src/models/deadline.db";
import { findUniqueMentorWithProjectData } from "src/models/mentors.db";
import { findFirstSubmission } from "src/models/submissions.db";
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

  const milestones = await findManyDeadlines({
    where: { cohortYear: cohortYear, type: "Milestone" },
  });

  const menteeSubmissions = milestones.map(async (milestone) => {
    const pDeadlineSubmissions = projects.map(async (project) => {
      const submission = await findFirstSubmission({
        where: { fromProjectId: project.id, deadlineId: milestone.id },
      });
      return {
        fromProject: project,
        submission: submission ? submission : undefined,
      };
    });
    return {
      deadline: milestone,
      submissions: await Promise.all(pDeadlineSubmissions),
    };
  });
  return await Promise.all(menteeSubmissions);
}
