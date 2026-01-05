import express from "express";
import { isAdmin, requireSignIn } from "./../middlewares/authMiddleware.js";
import {
  categoryControlller,
  createCategoryController,
  deleteCategoryCOntroller,
  singleCategoryController,
  updateCategoryController,
} from "./../controllers/categoryController.js";

const router = express.Router();

const invalidateCache = (patterns = []) => {
  return (req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
      patterns.forEach(pattern => {
        console.log(`Cache invalidation: clearing ${pattern} cache`);
      });
      return originalJson.call(this, data);
    };
    next();
  };
};


router.post(
  "/create-category",
  requireSignIn,
  isAdmin,
  invalidateCache(['category']),
  createCategoryController
);


router.put(
  "/update-category/:id",
  requireSignIn,
  isAdmin,
  invalidateCache(['category']),
  updateCategoryController
);


router.get("/get-category", categoryControlller);


router.get("/single-category/:slug", singleCategoryController);


router.delete(
  "/delete-category/:id",
  requireSignIn,
  isAdmin,
  invalidateCache(['category']),
  deleteCategoryCOntroller
);

export default router;
