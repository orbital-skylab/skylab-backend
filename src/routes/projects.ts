import { Router, Request, Response } from "express";
import { SkylabError } from "../errors/SkylabError";
import {
  createProject,
  deleteOneProjectById,
  editProjectDataByProjectID,
  getManyProjectsLean,
  getManyProjectsWithFilter,
  getOneProjectById,
  getProjectsViaRoleIds,
  getPublicProjects,
} from "../helpers/projects.helper";
import authorizeAdmin from "../middleware/authorizeAdmin";
import authorizeAdviserOfProject from "../middleware/authorizeAdviserOfProject";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";
import { Project } from "@prisma/client";

const router = Router();

const projectGalleryCache = {
  data: null as Project[] | null,
  lastUpdated: 0,
};

const CACHE_TTL = Number(
  process.env.PROJECT_GALLERY_CACHE_TTL_MS ?? 5 * 60 * 1000
);

router
  .get("/", async (req: Request, res: Response) => {
    try {
      const { limit, page, achievement, search } = req.query;

      const isDefaultFetch =
        (page === "0" || !page) &&
        (search === "" || !search) &&
        String(achievement).toUpperCase() === "ARTEMIS" &&
        (!limit || Number(limit) === 16);

      if (
        isDefaultFetch &&
        projectGalleryCache.data &&
        Date.now() - projectGalleryCache.lastUpdated < CACHE_TTL
      ) {
        console.log("Cache hit");
        return apiResponseWrapper(res, { projects: projectGalleryCache.data });
      }
      console.log("Cache missed");

      const allProjects = await getManyProjectsWithFilter(req.query);

      if (isDefaultFetch) {
        projectGalleryCache.data = allProjects;
        projectGalleryCache.lastUpdated = Date.now();
      }

      return apiResponseWrapper(res, { projects: allProjects });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .post("/", authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const createdProject = await createProject(req.body);

      projectGalleryCache.data = null;

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
    return apiResponseWrapper(res, { projects: projects });
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

router.get("/public", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getPublicProjects({ page, limit });
    return apiResponseWrapper(res, result);
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
  .put(
    "/:projectId",
    authorizeAdviserOfProject,
    async (req: Request, res: Response) => {
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
    }
  )
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
