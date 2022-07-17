import { Request, Response, Router } from "express";
import {
  createGroupWithAdviser,
  deleteGroupByGroupID,
  editGroupByGroupID,
  getAllGroupsByAdviserID,
} from "src/helpers/groups.helper";
import {
  apiResponseWrapper,
  routeErrorHandler,
} from "src/utils/ApiResponseWrapper";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const createdGroup = await createGroupWithAdviser(req.body);
    return apiResponseWrapper(res, { group: createdGroup });
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router.get("/adviser/:adviserId", async (req: Request, res: Response) => {
  const { adviserId } = req.params;
  try {
    const groupsUnderAdviser = await getAllGroupsByAdviserID(Number(adviserId));
    return groupsUnderAdviser;
  } catch (e) {
    return routeErrorHandler(res, e);
  }
});

router
  .put("/:groupId", async (req: Request, res: Response) => {
    const { groupId } = req.params;
    try {
      const editedGroup = await editGroupByGroupID(Number(groupId), req.body);
      return apiResponseWrapper(res, { group: editedGroup });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  })
  .delete("/:groupId", async (req: Request, res: Response) => {
    const { groupId } = req.params;
    try {
      const deletedGroup = await deleteGroupByGroupID(Number(groupId));
      return apiResponseWrapper(res, { group: deletedGroup });
    } catch (e) {
      return routeErrorHandler(res, e);
    }
  });

export default router;
