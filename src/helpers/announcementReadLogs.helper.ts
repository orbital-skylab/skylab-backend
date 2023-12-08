import { TargetAudienceRole } from "@prisma/client";
import { SkylabError } from "../errors/SkylabError";
import { countAdvisers } from "../models/advisers.db";
import {
  countAnnouncementReadLogs,
  upsertOneAnnouncementReadLog,
} from "../models/announcementReadLogs.db";
import { getOneAnnouncement } from "../models/announcements.db";
import { countMentors } from "../models/mentors.db";
import { countStudents } from "../models/students.db";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";

export async function getAnnouncementReadPercentage({
  announcementId,
}: {
  announcementId: number;
}) {
  const totalReadCount = await countAnnouncementReadLogs({
    where: {
      id: announcementId,
    },
  });

  const announcement = await getOneAnnouncement({
    where: {
      id: announcementId,
    },
  });

  const { targetAudienceRole, cohortYear } = announcement;

  let totalUserCount = 0;

  if (
    targetAudienceRole === TargetAudienceRole.All ||
    targetAudienceRole === TargetAudienceRole.Student
  ) {
    totalUserCount += await countStudents({
      where: {
        cohortYear,
      },
    });
  }

  if (
    targetAudienceRole === TargetAudienceRole.All ||
    targetAudienceRole === TargetAudienceRole.Adviser
  ) {
    totalUserCount += await countAdvisers({
      where: {
        cohortYear,
      },
    });
  }

  if (
    targetAudienceRole === TargetAudienceRole.All ||
    targetAudienceRole === TargetAudienceRole.Mentor
  ) {
    totalUserCount += await countMentors({
      where: {
        cohortYear,
      },
    });
  }

  return {
    totalReadCount,
    totalUserCount,
    percentage: totalReadCount / totalUserCount,
  };
}

export async function createAnnouncementReadLog({
  userId,
  announcementId,
}: {
  userId: number;
  announcementId: number;
}) {
  const announcementReadLog = await upsertOneAnnouncementReadLog({
    where: {
      userId_announcementId: {
        userId,
        announcementId,
      },
    },
    update: {
      updatedAt: new Date(),
    },
    create: {
      user: {
        connect: {
          id: userId,
        },
      },
      announcement: {
        connect: {
          id: announcementId,
        },
      },
    },
  });

  if (!announcementReadLog) {
    throw new SkylabError(
      "Error occurred while creating announcement read log",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  return announcementReadLog;
}
