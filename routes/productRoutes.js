import express from "express";
import {
  brainTreePaymentController,
  braintreeTokenController,
  codPaymentController,
  createProductController,
  deleteProductController,
  getProductController,
  getSingleProductController,
  productCategoryController,
  productCountController,
  productFiltersController,
  productListController,
  realtedProductController,
  searchProductController,
  searchSuggestionsController,
  updateProductController,
  addReviewController,
  getProductReviewsController,
} from "../controllers/productController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import formidable from "express-formidable";

const router = express.Router();

const invalidateCache = (patterns = []) => {
  return (req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
      patterns.forEach(pattern => {
        console.log(`Cache invalidation: clearing ${pattern} cache`);
        // Clear cache entries that match the pattern
        if (global.cache) {
          const keys = Array.from(global.cache.cache.keys());
          keys.forEach(key => {
            if (key.includes(pattern)) {
              global.cache.delete(key);
              console.log(`Deleted cache key: ${key}`);
            }
          });
        }
      });
      return originalJson.call(this, data);
    };
    next();
  };
};

router.post(
  "/create-product",
  requireSignIn,
  isAdmin,
  formidable(),
  invalidateCache(['product']),
  createProductController
);
router.put(
  "/update-product/:pid",
  requireSignIn,
  isAdmin,
  formidable(),
  invalidateCache(['product']),
  updateProductController
);


router.get("/get-product", getProductController);


router.get("/get-product/:slug", getSingleProductController);


router.delete("/delete-product/:pid", invalidateCache(['product']), deleteProductController);


router.post("/product-filters", productFiltersController);


router.get("/product-count", productCountController);


router.get("/product-list/:page", productListController);


router.get("/search/:keyword", searchProductController);


router.get("/search-suggestions/:keyword", searchSuggestionsController);


router.get("/related-product/:pid/:cid", realtedProductController);


router.get("/product-category/:slug", productCategoryController);


router.get("/braintree/token", braintreeTokenController);


router.post("/braintree/payment", requireSignIn, brainTreePaymentController);


router.post("/cod-payment", requireSignIn, codPaymentController);


router.post("/review/:productId", requireSignIn, invalidateCache(['reviews']), addReviewController);
router.get("/reviews/:productId", getProductReviewsController);

export default router;
