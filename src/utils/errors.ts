export const userEmailNotFoundError = new Error(
  "User With This Email Does Not Exist"
);

export const unknownInternalServerError = new Error(
  "Internal Server Occurred While Processing Request"
);

export const apiCallArgumentsMissingError = new Error(
  "One of the request parameters are missing"
);
