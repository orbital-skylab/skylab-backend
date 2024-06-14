/**
 * Contains data for testing the voteEvent testing
 */

export const MOCK_VOTE_EVENT_1 = {
  title: "Event 1",
  startTime: new Date(),
  endTime: new Date(),
};

export const MOCK_VOTE_EVENT_1_WITH_ID = {
  ...MOCK_VOTE_EVENT_1,
  id: 1,
};

export const MOCK_VOTE_EVENT_2 = {
  title: "Event 2",
  startTime: new Date(),
  endTime: new Date(),
};

export const MOCK_VOTE_EVENT_2_WITH_ID = {
  ...MOCK_VOTE_EVENT_2,
  id: 2,
};

export const MOCK_UPDATED_VOTE_EVENT_1 = {
  id: 1,
  title: "Updated Event 1",
  startTime: new Date(),
  endTime: new Date(),
};

export const VOTER_ID_1 = "voter1";

export const VOTER_ID_2 = "voter2";

export const MOCK_EXTERNAL_VOTER_1 = {
  id: VOTER_ID_1,
  voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
};

export const MOCK_EXTERNAL_VOTER_2 = {
  id: VOTER_ID_2,
  voteEventId: MOCK_VOTE_EVENT_1_WITH_ID.id,
};

export const MOCK_PROJECT_1 = {
  name: "Project 1",
  adviserId: 1,
  mentorId: 1,
  achievement: "Artemis",
  cohortYear: 2024,
  proposalPdf: "https://www.google.com",
  posterUrl: "https://loremflickr.com/640/480",
  videoUrl: "https://www.youtube.com/watch?v=6n3pFFPSlW4",
  teamName: "Team 1",
  hasDropped: false,
};

export const MOCK_PROJECT_1_WITH_ID = {
  ...MOCK_PROJECT_1,
  id: 1,
};

export const MOCK_PROJECT_2 = {
  name: "Project 2",
  adviserId: 2,
  mentorId: 2,
  achievement: "Apollo",
  cohortYear: 2024,
  proposalPdf: "https://www.google.com",
  posterUrl: "https://loremflickr.com/640/480",
  videoUrl: "https://www.youtube.com/watch?v=6n3pFFPSlW4",
  teamName: "Team 2",
  hasDropped: false,
};

export const MOCK_PROJECT_2_WITH_ID = {
  ...MOCK_PROJECT_2,
  id: 2,
};

export const MOCK_USER_1 = {
  id: 1,
  name: "John Doe",
  email: "john.doe@example.com",
  profilePicUrl: "https://example.com/profile-pic.jpg",
  githubUrl: "https://github.com/johndoe",
  linkedinUrl: "https://linkedin.com/in/johndoe",
  personalSiteUrl: "https://johndoe.com",
  selfIntro:
    "Hi, I'm John Doe, a software developer with a passion for open-source.",
  password: "$2b$10$eXamPl3HasH3dP4ssw0rD.", // Hashed password
  submitterId: null,
  administrator: [],
  adviser: [],
  mentor: [],
  student: [],
  submitted: [],
  received: [],
  announcements: [],
  announcementComments: [],
  announcementReadLogs: [],
  voteEvents: [],
  Vote: [],
};

export const NON_EXISTENT_ID = 99999999;

export const NON_EXISTENT_USER_EMAIL = "non.existent@example.com";
