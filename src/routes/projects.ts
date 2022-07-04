import { Router, Request, Response } from "express";
import { SkylabError } from "src/errors/SkylabError";
import {
  addUsersToProject,
  createProjectHelper,
  getFilteredProjects,
  getLeanProjects,
  getOneProjectById,
} from "src/helpers/projects.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router
  .get("/", async (req: Request, res: Response) => {
    try {
      const allProjects = await getFilteredProjects(req.query);
      return apiResponseWrapper(res, allProjects);
    } catch (e) {
      console.log(e);
      return routeErrorHandler(res, e);
    }
  })
  .post("/", async (req: Request, res: Response) => {
    if (!req.body.project) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .send("Parameters missing from request");
    }

    try {
      await createProjectHelper(req.body.project);
      return apiResponseWrapper(res, {});
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .all("/", (_: Request, res: Response) => {
    return routeErrorHandler(
      res,
      new SkylabError(
        "Invalid method to access endpoint",
        HttpStatusCode.BAD_REQUEST
      )
    );
  });

router.get("/lean", async (req: Request, res: Response) => {
  if (!req.query.cohortYear) {
    throw new SkylabError(
      "Cohort Year missing from request query",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const { cohortYear } = req.query;
  try {
    const projects = await getLeanProjects(Number(cohortYear));
    return apiResponseWrapper(res, projects);
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get("/:projectId", async (req: Request, res: Response) => {
  const { projectId } = req.params;

  try {
    const projectWithId = await getOneProjectById(Number(projectId));
    return apiResponseWrapper(res, { project: projectWithId });
  } catch (e) {
    routeErrorHandler(res, e);
  }
});

router.put("/users", async (req: Request, res: Response) => {
  if (!req.body.projectId) {
    return res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Parameters missing from request");
  }

  const { projectId } = req.body;

  if (!req.body.students && !req.body.mentor && !req.body.adviser) {
    throw new SkylabError(
      "Parameters missing from request",
      HttpStatusCode.BAD_REQUEST
    );
  }

  const { students, mentor, adviser } = req.body;

  const users = {
    students: students,
    mentor: mentor,
    adviser: adviser,
  };

  try {
    await addUsersToProject(projectId, users);
    return res.sendStatus(HttpStatusCode.OK);
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

export default router;
