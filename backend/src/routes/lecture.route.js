import express from "express"
import { deleteLecture , getCLoudinarySignature , updateLecture, uploadLecture } from "../controllers/lecture.controller.js";
import { protect , authorise } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/:courseId/cloud-signature",protect , authorise("teacher") , getCLoudinarySignature)
router.post("/:courseId/lecture/add",protect , authorise("teacher") , uploadLecture)
router.patch("/lecture/update/:lectureId",protect , authorise("teacher") , updateLecture)
router.delete("/:courseId/lecture/delete/:lectureId",protect , authorise("teacher") , deleteLecture)

export default router