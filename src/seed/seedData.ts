import { Prisma } from "@prisma/client";

export const createCohortData: Prisma.CohortCreateInput = {
  startDate: new Date("2022-08-01T03:24:00"),
  endDate: new Date("2023-05-15T03:24:00"),
  academicYear: 2022,
};

export const createDeadline1: Prisma.DeadlineCreateInput = {
  name: "Milestone 1",
  cohort: { connect: { academicYear: 2022 } },
  dueBy: new Date("2022-06-01T03:24:00"),
  desc: "The first Milestone of Orbital",
  type: "Milestone",
};
export const createDeadline2: Prisma.DeadlineCreateInput = {
  name: "Milestone 2",
  cohort: { connect: { academicYear: 2022 } },
  dueBy: new Date("2022-07-01T03:24:00"),
  desc: "The second Milestone of Orbital",
  type: "Milestone",
};
export const createDeadline3: Prisma.DeadlineCreateInput = {
  name: "Milestone 3",
  cohort: { connect: { academicYear: 2022 } },
  dueBy: new Date("2022-08-01T03:24:00"),
  desc: "The third Milestone of Orbital",
  type: "Milestone",
};

export const batchCreateStudents: {
  count: number;
  accounts: {
    student: Omit<Omit<Prisma.StudentCreateInput, "cohort">, "user"> & {
      cohortYear: number;
    };
    user: Prisma.UserCreateInput;
  }[];
} = {
  count: 4,
  accounts: [
    {
      user: {
        email: "email1@email.com",
        password: "Test!234",
      },
      student: {
        cohortYear: 2022,
        nusnetId: "E0000000",
        matricNo: "A0000001A",
      },
    },
    {
      student: {
        cohortYear: 2022,
        nusnetId: "E0000001",
        matricNo: "A0000002B",
      },
      user: {
        email: "email2@email.com",
        password: "Test!234",
      },
    },
    {
      student: {
        cohortYear: 2022,
        nusnetId: "E0000002",
        matricNo: "A0000003C",
      },
      user: {
        email: "email3@email.com",
        password: "Test!234",
      },
    },
    {
      student: {
        cohortYear: 2022,
        nusnetId: "E0000003",
        matricNo: "A0000004D",
      },
      user: {
        email: "email4@email.com",
        password: "Test!234",
      },
    },
  ],
};

export const batchCreateMentors: {
  count: number;
  accounts: {
    user: Prisma.UserCreateInput;
    mentor: Omit<Omit<Prisma.MentorCreateInput, "cohort">, "user"> & {
      cohortYear: number;
    };
  }[];
} = {
  count: 2,
  accounts: [
    {
      user: {
        email: "mentor1@email.com",
        password: "Test!234",
      },
      mentor: {
        cohortYear: 2022,
      },
    },
    {
      user: {
        email: "mentor2@email.com",
        password: "Test!234",
      },
      mentor: {
        cohortYear: 2022,
      },
    },
  ],
};

export const batchCreateAdvisers: {
  count: number;
  accounts: {
    adviser: Omit<Omit<Prisma.AdviserCreateInput, "cohort">, "user"> & {
      cohortYear: number;
    };
    user: Prisma.UserCreateInput;
  }[];
} = {
  count: 2,
  accounts: [
    {
      user: {
        email: "adviser1@email.com",
        password: "Test!234",
      },
      adviser: { cohortYear: 2022 },
    },
    {
      user: {
        email: "adviser2@email.com",
        password: "Test!234",
      },
      adviser: { cohortYear: 2022 },
    },
  ],
};

export const createProject1: {
  project: {
    cohortYear: number;
    students: number[];
    adviser: number;
    mentor: number;
  } & Prisma.ProjectCreateWithoutCohortInput;
} = {
  project: {
    cohortYear: 2022,
    students: [1, 2],
    mentor: 5,
    adviser: 7,
    name: "NUSGrabYourOwnFood",
    achievement: "Vostok",
  },
};
