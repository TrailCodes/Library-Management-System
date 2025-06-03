import { isAuthenticated , isAuthorized} from "../middleware/authMiddleware.js";
import  {addBook,deleteBook,getAllBooks} from "../controllers/bookController.js";

import express from 'express';

const router = express.Router();

router.post("/admin/add", isAuthorized , isAuthenticated("Admin"),addBook);
router.get("/all", getAllBooks);
router.delete("/delete/:id", isAuthorized, isAuthenticated("Admin"), deleteBook);

export default router ;