/* eslint-disable @typescript-eslint/no-unused-vars */
import { Milestone, Prisma, Project } from "@prisma/client";
import { getManyMilestones, getOneMilestone } from "src/models/milestones.db";

export const getMilestoneInputParser = (
  milestone: Prisma.MilestoneGetPayload<{ include: { project: true } }>
) => {
  const { project, ...milestoneData } = milestone;
  const { id, ...projectData } = project;
  return { ...milestoneData, ...projectData };
};

export const getAllMilestonesOfNo = async (milestoneNo: number) => {
  const milestones = await getManyMilestones({
    include: { project: true },
    where: { milestoneNo: milestoneNo },
  });
  return;
};
