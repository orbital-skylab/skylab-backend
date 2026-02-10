import { AchievementLevel } from "@prisma/client";

/**
 * Mock data for testing the public projects feature
 */

export const MOCK_USER_BASE = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  password: "hashedpassword",
  profilePicUrl: null,
  githubUrl: null,
  linkedinUrl: null,
  personalSiteUrl: null,
};

export const MOCK_STUDENT_1 = {
  id: 1,
  userId: 1,
  nusnetId: "e0123456",
  matricNo: "A0123456X",
  cohortYear: 2024,
  user: { ...MOCK_USER_BASE, id: 1, name: "Student One" },
};

export const MOCK_STUDENT_2 = {
  id: 2,
  userId: 2,
  nusnetId: "e0123457",
  matricNo: "A0123457Y",
  cohortYear: 2024,
  user: { ...MOCK_USER_BASE, id: 2, name: "Student Two" },
};

export const MOCK_ADVISER = {
  id: 1,
  userId: 3,
  nusnetId: "e0123458",
  cohortYear: 2024,
  user: { ...MOCK_USER_BASE, id: 3, name: "Adviser One" },
};

export const MOCK_MENTOR = {
  id: 1,
  userId: 4,
  cohortYear: 2024,
  user: { ...MOCK_USER_BASE, id: 4, name: "Mentor One" },
};

// Projects sorted by cohortYear DESC, then achievement rank
export const MOCK_PROJECT_ARTEMIS_2024 = {
  id: 1,
  name: "Artemis Project 2024",
  teamName: "Team Artemis",
  proposalPdf: "https://example.com/proposal1.pdf",
  posterUrl: "https://example.com/poster1.jpg",
  videoUrl: "https://example.com/video1",
  achievement: "Artemis" as AchievementLevel,
  cohortYear: 2024,
  hasDropped: false,
  adviserId: 1,
  mentorId: 1,
  students: [MOCK_STUDENT_1],
  adviser: MOCK_ADVISER,
  mentor: MOCK_MENTOR,
};

export const MOCK_PROJECT_APOLLO_2024 = {
  id: 2,
  name: "Apollo Project 2024",
  teamName: "Team Apollo",
  proposalPdf: "https://example.com/proposal2.pdf",
  posterUrl: "https://example.com/poster2.jpg",
  videoUrl: "https://example.com/video2",
  achievement: "Apollo" as AchievementLevel,
  cohortYear: 2024,
  hasDropped: false,
  adviserId: 1,
  mentorId: 1,
  students: [MOCK_STUDENT_2],
  adviser: MOCK_ADVISER,
  mentor: MOCK_MENTOR,
};

export const MOCK_PROJECT_GEMINI_2024 = {
  id: 3,
  name: "Gemini Project 2024",
  teamName: "Team Gemini",
  proposalPdf: "https://example.com/proposal3.pdf",
  posterUrl: "https://example.com/poster3.jpg",
  videoUrl: "https://example.com/video3",
  achievement: "Gemini" as AchievementLevel,
  cohortYear: 2024,
  hasDropped: false,
  adviserId: 1,
  mentorId: null,
  students: [],
  adviser: MOCK_ADVISER,
  mentor: null,
};

export const MOCK_PROJECT_VOSTOK_2024 = {
  id: 4,
  name: "Vostok Project 2024",
  teamName: "Team Vostok",
  proposalPdf: "https://example.com/proposal4.pdf",
  posterUrl: null,
  videoUrl: null,
  achievement: "Vostok" as AchievementLevel,
  cohortYear: 2024,
  hasDropped: false,
  adviserId: null,
  mentorId: null,
  students: [],
  adviser: null,
  mentor: null,
};

export const MOCK_PROJECT_ARTEMIS_2023 = {
  id: 5,
  name: "Artemis Project 2023",
  teamName: "Team Artemis 2023",
  proposalPdf: "https://example.com/proposal5.pdf",
  posterUrl: "https://example.com/poster5.jpg",
  videoUrl: "https://example.com/video5",
  achievement: "Artemis" as AchievementLevel,
  cohortYear: 2023,
  hasDropped: false,
  adviserId: 1,
  mentorId: 1,
  students: [MOCK_STUDENT_1],
  adviser: MOCK_ADVISER,
  mentor: MOCK_MENTOR,
};

export const MOCK_PROJECT_DROPPED = {
  id: 6,
  name: "Dropped Project",
  teamName: "Team Dropped",
  proposalPdf: null,
  posterUrl: null,
  videoUrl: null,
  achievement: "Artemis" as AchievementLevel,
  cohortYear: 2024,
  hasDropped: true,
  adviserId: null,
  mentorId: null,
  students: [],
  adviser: null,
  mentor: null,
};

// ─── Edge Case Mocks ──────────────────────────────────────────────────────────

/** Project with null achievement level */
export const MOCK_PROJECT_NULL_ACHIEVEMENT = {
  id: 7,
  name: "No Achievement Project",
  teamName: "Team Null Achievement",
  proposalPdf: null,
  posterUrl: null,
  videoUrl: null,
  achievement: null,
  cohortYear: 2024,
  hasDropped: false,
  adviserId: 1,
  mentorId: null,
  students: [MOCK_STUDENT_1],
  adviser: MOCK_ADVISER,
  mentor: null,
};

/** Project with no students */
export const MOCK_PROJECT_NO_STUDENTS = {
  id: 8,
  name: "No Students Project",
  teamName: "Team No Students",
  proposalPdf: "https://example.com/proposal8.pdf",
  posterUrl: "https://example.com/poster8.jpg",
  videoUrl: null,
  achievement: "Apollo" as AchievementLevel,
  cohortYear: 2024,
  hasDropped: false,
  adviserId: 1,
  mentorId: 1,
  students: [],
  adviser: MOCK_ADVISER,
  mentor: MOCK_MENTOR,
};

/** Project with only a mentor (no adviser) */
export const MOCK_PROJECT_MENTOR_ONLY = {
  id: 9,
  name: "Mentor Only Project",
  teamName: "Team Mentor Only",
  proposalPdf: null,
  posterUrl: null,
  videoUrl: null,
  achievement: "Gemini" as AchievementLevel,
  cohortYear: 2023,
  hasDropped: false,
  adviserId: null,
  mentorId: 1,
  students: [MOCK_STUDENT_2],
  adviser: null,
  mentor: MOCK_MENTOR,
};

/** Project with only an adviser (no mentor) */
export const MOCK_PROJECT_ADVISER_ONLY = {
  id: 10,
  name: "Adviser Only Project",
  teamName: "Team Adviser Only",
  proposalPdf: "https://example.com/proposal10.pdf",
  posterUrl: null,
  videoUrl: "https://example.com/video10",
  achievement: "Vostok" as AchievementLevel,
  cohortYear: 2023,
  hasDropped: false,
  adviserId: 1,
  mentorId: null,
  students: [MOCK_STUDENT_1, MOCK_STUDENT_2],
  adviser: MOCK_ADVISER,
  mentor: null,
};

/** Project with no mentor, no adviser, and no students */
export const MOCK_PROJECT_ALL_NULL_RELATIONSHIPS = {
  id: 11,
  name: "Bare Project",
  teamName: "Team Bare",
  proposalPdf: null,
  posterUrl: null,
  videoUrl: null,
  achievement: "Vostok" as AchievementLevel,
  cohortYear: 2022,
  hasDropped: false,
  adviserId: null,
  mentorId: null,
  students: [],
  adviser: null,
  mentor: null,
};

/** Project with two students for multi-student parsing tests */
export const MOCK_PROJECT_TWO_STUDENTS = {
  id: 12,
  name: "Two Students Project",
  teamName: "Team Pair",
  proposalPdf: "https://example.com/proposal12.pdf",
  posterUrl: "https://example.com/poster12.jpg",
  videoUrl: "https://example.com/video12",
  achievement: "Artemis" as AchievementLevel,
  cohortYear: 2024,
  hasDropped: false,
  adviserId: 1,
  mentorId: 1,
  students: [MOCK_STUDENT_1, MOCK_STUDENT_2],
  adviser: MOCK_ADVISER,
  mentor: MOCK_MENTOR,
};

// ─── Aggregate Collections ────────────────────────────────────────────────────

// All mock projects in unsorted order (simulating DB response)
export const MOCK_ALL_PROJECTS_UNSORTED = [
  MOCK_PROJECT_VOSTOK_2024,
  MOCK_PROJECT_ARTEMIS_2023,
  MOCK_PROJECT_APOLLO_2024,
  MOCK_PROJECT_ARTEMIS_2024,
  MOCK_PROJECT_GEMINI_2024,
];

// Expected order after sorting: cohortYear DESC, then achievement rank ASC
// 2024: Artemis(1) -> Apollo(2) -> Gemini(3) -> Vostok(4)
// 2023: Artemis(1)
export const MOCK_ALL_PROJECTS_SORTED = [
  MOCK_PROJECT_ARTEMIS_2024,
  MOCK_PROJECT_APOLLO_2024,
  MOCK_PROJECT_GEMINI_2024,
  MOCK_PROJECT_VOSTOK_2024,
  MOCK_PROJECT_ARTEMIS_2023,
];

// All edge case projects in unsorted order for comprehensive tests
export const MOCK_EDGE_CASE_PROJECTS_UNSORTED = [
  MOCK_PROJECT_NULL_ACHIEVEMENT,
  MOCK_PROJECT_ALL_NULL_RELATIONSHIPS,
  MOCK_PROJECT_MENTOR_ONLY,
  MOCK_PROJECT_TWO_STUDENTS,
  MOCK_PROJECT_ADVISER_ONLY,
  MOCK_PROJECT_NO_STUDENTS,
];

// Expected order after sorting for edge case projects:
// 2024: Apollo(2, id8), null-achievement(999, id7)
// 2023: Gemini(3, id9), Vostok(4, id10)
// 2022: Vostok(4, id11)
// Note: MOCK_PROJECT_TWO_STUDENTS is Artemis 2024 (rank 1) so it comes first in 2024
export const MOCK_EDGE_CASE_PROJECTS_SORTED = [
  MOCK_PROJECT_TWO_STUDENTS, // 2024, Artemis(1)
  MOCK_PROJECT_NO_STUDENTS, // 2024, Apollo(2)
  MOCK_PROJECT_NULL_ACHIEVEMENT, // 2024, null(999)
  MOCK_PROJECT_MENTOR_ONLY, // 2023, Gemini(3)
  MOCK_PROJECT_ADVISER_ONLY, // 2023, Vostok(4)
  MOCK_PROJECT_ALL_NULL_RELATIONSHIPS, // 2022, Vostok(4)
];
