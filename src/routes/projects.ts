import { Router, Request, Response } from "express";
import { SkylabError } from "src/errors/SkylabError";
import {
  addAdviserToProject,
  addMentorToProject,
  addStudentsToProject,
  createProjectHelper,
  getManyProjectsHelper,
} from "src/helpers/projects.helper";
import { HttpStatusCode } from "src/utils/HTTP_Status_Codes";

const router = Router();

router
  .get("/", async (req: Request, res: Response) => {
    try {
      const allProjects = await getManyProjectsHelper(req.query);
      res.status(HttpStatusCode.OK).json(allProjects);
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      } else {
        res.status(e.statusCode).send(e.message);
      }
    }
  })
  .post("/", async (req: Request, res: Response) => {
    if (!req.body.project) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .send("Parameters missing from request");
    }

    const { project } = req.body;

    try {
      await createProjectHelper(project);
      return res.sendStatus(HttpStatusCode.OK);
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      } else {
        res.status(e.statusCode).send(e.message);
      }
    }
  })
  .all("/", (_: Request, res: Response) => {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Invalid method to access endpoint");
  });

router
  .put("/students", async (req: Request, res: Response) => {
    if (!req.body.students || !req.body.projectId) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .send("Parameters missing from request");
    }

    const { students, projectId } = req.body;

    try {
      await addStudentsToProject(projectId, students);
      return res.sendStatus(HttpStatusCode.OK);
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      } else {
        return res.status(e.statusCode).send(e.message);
      }
    }
  })
  .all("/students", (_: Request, res: Response) => {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Invalid method to access endpoint");
  });

router
  .put("/mentor", async (req: Request, res: Response) => {
    if (!req.body.mentor || !req.body.projectId) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .send("Parameters missing from request");
    }

    const { mentor, projectId } = req.body;

    try {
      await addMentorToProject(projectId, mentor);
      return res.sendStatus(HttpStatusCode.OK);
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      } else {
        return res.status(e.statusCode).send(e.message);
      }
    }
  })
  .all("/mentor", (_: Request, res: Response) => {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Invalid method to access endpoint");
  });

router
  .put("/adviser", async (req: Request, res: Response) => {
    if (!req.body.adviser || !req.body.projectId) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .send("Parameters missing from request");
    }

    const { adviser, projectId } = req.body;

    try {
      await addAdviserToProject(projectId, adviser);
      return res.sendStatus(HttpStatusCode.OK);
    } catch (e) {
      if (!(e instanceof SkylabError)) {
        return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send(e.message);
      } else {
        return res.status(e.statusCode).send(e.message);
      }
    }
  })
  .all("/adviser", (_: Request, res: Response) => {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .send("Invalid method to access endpoint");
  });

export default router;
