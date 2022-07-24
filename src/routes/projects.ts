import { Router, Request, Response } from "express";
import { SkylabError } from "src/errors/SkylabError";
import {
  createProject,
  deleteOneProjectById,
  editProjectDataByProjectID,
  getManyProjectsLean,
  getManyProjectsWithFilter,
  getOneProjectById,
  getProjectsViaRoleIds,
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
      const allProjects = await getManyProjectsWithFilter(req.query);
      return apiResponseWrapper(res, { projects: allProjects });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .post("/", async (req: Request, res: Response) => {
    try {
      const createdProject = await createProject(req.body);
      return apiResponseWrapper(res, { project: createdProject });
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

router.get("/student/:studentId", async (req: Request, res: Response) => {
  const { studentId } = req.params;
  try {
    const project = await getProjectsViaRoleIds({
      studentId: Number(studentId),
    });
    return apiResponseWrapper(res, { project: project });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get("/adviser/:adviserId", async (req: Request, res: Response) => {
  const { adviserId } = req.params;
  try {
    const projects = await getProjectsViaRoleIds({
      adviserId: Number(adviserId),
    });
    return apiResponseWrapper(res, projects);
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get("/mentor/:mentorId", async (req: Request, res: Response) => {
  const { mentorId } = req.params;
  try {
    const projects = await getProjectsViaRoleIds({
      mentorId: Number(mentorId),
    });
    return apiResponseWrapper(res, { projects: projects });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get("/lean", async (req: Request, res: Response) => {
  const { cohortYear, dropped } = req.query;

  try {
    if (!dropped) {
      const projects = await getManyProjectsLean(Number(cohortYear));
      return apiResponseWrapper(res, { projects: projects });
    } else {
      const projects = await getManyProjectsLean(
        Number(cohortYear),
        dropped == "true" ? true : false
      );
      return apiResponseWrapper(res, { projects: projects });
    }
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router
  .get("/:projectId", async (req: Request, res: Response) => {
    const { projectId } = req.params;

    try {
      const projectWithId = await getOneProjectById(Number(projectId));
      return apiResponseWrapper(res, { project: projectWithId });
    } catch (e) {
      routeErrorHandler(res, e);
    }
  })
  .put("/:projectId", async (req: Request, res: Response) => {
    const { projectId } = req.params;

    try {
      const updatedProject = await editProjectDataByProjectID(
        Number(projectId),
        req.body
      );
      return apiResponseWrapper(res, { project: updatedProject });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .delete("/:projectId", async (req: Request, res: Response) => {
    const { projectId } = req.params;

    try {
      const deletedProject = await deleteOneProjectById(Number(projectId));
      return apiResponseWrapper(res, { project: deletedProject });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  });

export default router;
