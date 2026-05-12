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
  getPublicProjectCohortYears,
  getPublicProjects,
  getPublicProjectsCount,
} from "../helpers/projects.helper";
import authorizeAdmin from "../middleware/authorizeAdmin";
import authorizeAdviserOfProject from "../middleware/authorizeAdviserOfProject";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "../utils/ApiResponseWrapper";
import { HttpStatusCode } from "../utils/HTTP_Status_Codes";

/** Pagination constraints for input validation */
const PAGINATION_LIMITS = {
  MIN_PAGE: 1,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
} as const;

/**
 * Validate and parse pagination query parameters
 */
function parsePaginationParams(query: Request["query"]): {
  page: number;
  limit: number;
} {
  const rawPage = parseInt(query.page as string);
  const rawLimit = parseInt(query.limit as string);

  const page =
    !isNaN(rawPage) && rawPage >= PAGINATION_LIMITS.MIN_PAGE
      ? rawPage
      : PAGINATION_LIMITS.DEFAULT_PAGE;

  const limit =
    !isNaN(rawLimit) &&
    rawLimit >= PAGINATION_LIMITS.MIN_LIMIT &&
    rawLimit <= PAGINATION_LIMITS.MAX_LIMIT
      ? rawLimit
      : PAGINATION_LIMITS.DEFAULT_LIMIT;

  return { page, limit };
}

const router = Router();

type ProjectGalleryCacheValue = Awaited<
  ReturnType<typeof getManyProjectsWithFilter>
>;

type ProjectGalleryCacheEntry = {
  data: ProjectGalleryCacheValue;
  lastUpdated: number;
};

const projectGalleryCache = new Map<string, ProjectGalleryCacheEntry>();

const CACHE_TTL = Number(
  process.env.PROJECT_GALLERY_CACHE_TTL_MS ?? 5 * 60 * 1000
);

const getFirstQueryValue = (value: Request["query"][string]) => {
  return Array.isArray(value) ? value[0] : value;
};

const normalizeQueryValue = (value: Request["query"][string]) => {
  const firstValue = getFirstQueryValue(value);
  return firstValue === undefined || firstValue === null
    ? ""
    : String(firstValue);
};

export const isCacheableDefaultGalleryFetch = (query: Request["query"]) => {
  const { limit, page, achievement, search, cohortYear, dropped } = query;

  return (
    normalizeQueryValue(cohortYear) !== "" &&
    (normalizeQueryValue(page) === "0" || normalizeQueryValue(page) === "") &&
    normalizeQueryValue(search) === "" &&
    normalizeQueryValue(achievement).toUpperCase() === "ARTEMIS" &&
    (normalizeQueryValue(limit) === "" ||
      Number(normalizeQueryValue(limit)) === 16) &&
    (normalizeQueryValue(dropped) === "" ||
      normalizeQueryValue(dropped) === "false")
  );
};

export const getProjectGalleryCacheKey = (query: Request["query"]) => {
  return JSON.stringify({
    cohortYear: Number(normalizeQueryValue(query.cohortYear)),
    achievement: normalizeQueryValue(query.achievement).toLowerCase(),
    dropped: normalizeQueryValue(query.dropped) || "false",
    limit: Number(normalizeQueryValue(query.limit) || 16),
    page: Number(normalizeQueryValue(query.page) || 0),
    search: normalizeQueryValue(query.search),
  });
};

const clearProjectGalleryCache = () => {
  projectGalleryCache.clear();
};

const parseOptionalNumber = (value: Request["query"][string]) => {
  const numberValue = Number(normalizeQueryValue(value));
  return Number.isFinite(numberValue) && numberValue > 0
    ? numberValue
    : undefined;
};

router
  .get("/", async (req: Request, res: Response) => {
    try {
      const isDefaultFetch = isCacheableDefaultGalleryFetch(req.query);
      const cacheKey = isDefaultFetch
        ? getProjectGalleryCacheKey(req.query)
        : undefined;
      const cacheEntry = cacheKey
        ? projectGalleryCache.get(cacheKey)
        : undefined;

      if (
        isDefaultFetch &&
        cacheEntry &&
        Date.now() - cacheEntry.lastUpdated < CACHE_TTL
      ) {
        console.log("Cache hit");
        return apiResponseWrapper(res, { projects: cacheEntry.data });
      }
      console.log("Cache missed");

      const allProjects = await getManyProjectsWithFilter(req.query);

      if (cacheKey) {
        projectGalleryCache.set(cacheKey, {
          data: allProjects,
          lastUpdated: Date.now(),
        });
      }

      return apiResponseWrapper(res, { projects: allProjects });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .post("/", authorizeAdmin, async (req: Request, res: Response) => {
    try {
      const createdProject = await createProject(req.body);

      clearProjectGalleryCache();

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
    const { page, limit } = parsePaginationParams(req.query);
    const { achievement, cohortYear } = req.query;
    const parsedAchievement = normalizeQueryValue(achievement);
    const parsedCohortYear = parseOptionalNumber(cohortYear);

    const result = await getPublicProjects({
      page,
      limit,
      ...(parsedAchievement ? { achievement: parsedAchievement } : {}),
      ...(parsedCohortYear ? { cohortYear: parsedCohortYear } : {}),
    });
    return apiResponseWrapper(res, result);
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get("/public/cohorts", async (_req: Request, res: Response) => {
  try {
    const cohortYears = await getPublicProjectCohortYears();
    return apiResponseWrapper(res, { cohortYears });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

/**
 * GET /projects/public/count
 * Returns total number of public projects and total pages based on limit
 * Optional query param: achievement (filter by achievement level)
 */
router.get("/public/count", async (req: Request, res: Response) => {
  try {
    const { limit } = parsePaginationParams(req.query);
    const achievement = req.query.achievement as string | undefined;
    const cohortYear = parseOptionalNumber(req.query.cohortYear);

    const result = cohortYear
      ? await getPublicProjectsCount(limit, achievement, cohortYear)
      : await getPublicProjectsCount(limit, achievement);
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
        clearProjectGalleryCache();
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
      clearProjectGalleryCache();
      return apiResponseWrapper(res, { project: deletedProject });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  });

export default router;
