import {
  CohortQueryValidator,
  SearchQueryValidator,
  TargetAudienceRoleValidator,
} from "./validator";

export const GetAnnouncementsValidator = [
  CohortQueryValidator,
  SearchQueryValidator,
  TargetAudienceRoleValidator,
];
