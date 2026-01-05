import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";
import dotenv from "dotenv";
import cloudinary from "../config/cloudinary.js";

dotenv.config();

var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export const createProductController = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request fields:", req.fields);
    console.log("Request files:", req.files);
    
    const { name, description, price, category, quantity, shipping } = req.fields;
    const photo = req.files.photo;
    
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is Required" });
      case !description:
        return res.status(500).send({ error: "Description is Required" });
      case !price:
        return res.status(500).send({ error: "Price is Required" });
      case !category:
        return res.status(500).send({ error: "Category is Required" });
      case !quantity:
        return res.status(500).send({ error: "Quantity is Required" });
      case !photo:
        return res.status(500).send({ error: "Photo is Required" });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(photo.path, {
      folder: "products",
    });

    const products = new productModel({ 
      ...req.fields, 
      slug: slugify(name),
      photo: result.secure_url
    });

    await products.save();
    
    // Remove temporary file
    fs.unlinkSync(photo.path);
    
    res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in creating product",
    });
  }
};


export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .limit(12)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      counTotal: products.length,
      message: "All Products ",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting products",
      error: error.message,
    });
  }
};

export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .populate("category");
    res.status(200).send({
      success: true,
      message: "Single Product Fetched",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting single product",
      error,
    });
  }
};


export const deleteProductController = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.pid);
    res.status(200).send({
      success: true,
      message: "Product Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting product",
      error,
    });
  }
};

export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping, photo } =
      req.fields;
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is Required" });
      case !description:
        return res.status(500).send({ error: "Description is Required" });
      case !price:
        return res.status(500).send({ error: "Price is Required" });
      case !category:
        return res.status(500).send({ error: "Category is Required" });
      case !quantity:
        return res.status(500).send({ error: "Quantity is Required" });
      case !photo:
        return res.status(500).send({ error: "Photo URL is Required" });
    }

    const products = await productModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name) },
      { new: true }
    );
    
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Updated Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in Update product",
    });
  }
};


export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await productModel.find(args);
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error WHile Filtering Products",
      error,
    });
  }
};


export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Error in product count",
      error,
      success: false,
    });
  }
};


export const productListController = async (req, res) => {
  try {
    const perPage = 6;
    const page = req.params.page ? req.params.page : 1;
    const products = await productModel
      .find({})
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error in per page ctrl",
      error,
    });
  }
};

// search product
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    
    if (!keyword || keyword.trim().length === 0) {
      return res.status(200).json([]);
    }
    
    let results = await productModel
      .find(
        { $text: { $search: keyword } },
        { score: { $meta: "textScore" } }
      )
      .populate("category")
      .sort({ score: { $meta: "textScore" } });
    
    if (results.length === 0) {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      results = await productModel
        .find({
          $or: [
            { name: { $regex: escapedKeyword, $options: "i" } },
            { description: { $regex: escapedKeyword, $options: "i" } },
          ],
        })
        .populate("category");
    }
    
    res.json(results);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In Search Product API",
      error,
    });
  }
};


export const searchSuggestionsController = async (req, res) => {
  try {
    const { keyword } = req.params;
    
    if (!keyword || keyword.length < 2) {
      return res.status(200).json([]);
    }

    let suggestions = await productModel
      .find(
        { $text: { $search: keyword } },
        { score: { $meta: "textScore" } }
      )
      .select("name slug")
      .limit(5)
      .sort({ score: { $meta: "textScore" } });

    if (suggestions.length === 0) {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      suggestions = await productModel
        .find({
          $or: [
            { name: { $regex: escapedKeyword, $options: "i" } },
            { description: { $regex: escapedKeyword, $options: "i" } },
          ],
        })
        .select("name slug")
        .limit(5)
        .sort({ name: 1 });
    }

    const formattedSuggestions = suggestions.map(product => ({
      name: product.name,
      slug: product.slug
    }));

    res.status(200).json(formattedSuggestions);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error In Search Suggestions API",
      error,
    });
  }
};


export const realtedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .limit(3)
      .populate("category");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error while getting related product",
      error,
    });
  }
};


export const productCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    const products = await productModel.find({ category }).populate("category");
    res.status(200).send({
      success: true,
      category,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      error,
      message: "Error While Getting products",
    });
  }
};

//payment gateway api
//token
export const braintreeTokenController = async (req, res) => {
  try {
    gateway.clientToken.generate({}, function (err, response) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

export const brainTreePaymentController = async (req, res) => {
  try {
    const { nonce, cart } = req.body;
    let total = 0;
    const productIds = [];
    
    cart.map((i) => {
      total += i.price;
      productIds.push(i._id);
    });
    
    let newTransaction = gateway.transaction.sale(
      {
        amount: total,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true,
        },
      },
      async function (error, result) {
        if (result) {
          const order = await new orderModel({
            products: productIds,
            payment: result,
            buyer: req.user._id,
          }).save();
          res.json({ ok: true });
        } else {
          res.status(500).send(error);
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};


export const codPaymentController = async (req, res) => {
  try {
    const { cart } = req.body;
    let total = 0;
    const productIds = [];
    
    cart.map((i) => {
      total += i.price;
      productIds.push(i._id);
    });
    
    const order = await new orderModel({
      products: productIds,
      payment: {
        method: "COD",
        status: "Pending",
        amount: total
      },
      buyer: req.user._id,
      status: "Processing"
    }).save();
    
    res.json({ 
      success: true,
      message: "Order placed successfully! Pay on delivery."
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in COD payment",
      error: error.message,
    });
  }
};


export const addReviewController = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    if (rating < 1 || rating > 5) {
      return res.status(400).send({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    const existingReview = await productModel.findOne({
      _id: productId,
      "reviews.user": userId
    });

    if (existingReview) {
      return res.status(400).send({
        success: false,
        message: "You have already reviewed this product"
      });
    }

    const product = await productModel.findByIdAndUpdate(
      productId,
      {
        $push: {
          reviews: {
            user: userId,
            rating,
            comment
          }
        }
      },
      { new: true }
    ).populate("reviews.user", "name");

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found"
      });
    }

    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / product.reviews.length;

    await productModel.findByIdAndUpdate(productId, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: product.reviews.length
    });

    // Clear cache for this product's reviews
    const cacheKey = `cache:/api/v1/product/reviews/${productId}`;
    if (global.cache) {
      global.cache.delete(cacheKey);
      console.log(`Cache cleared for reviews: ${cacheKey}`);
    }

    res.status(200).send({
      success: true,
      message: "Review added successfully",
      product
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while adding review",
      error
    });
  }
};


export const getProductReviewsController = async (req, res) => {
  try {
    const { productId } = req.params;
    console.log("Getting reviews for productId:", productId);

    const product = await productModel.findById(productId)
      .populate("reviews.user", "name")
      .select("reviews averageRating totalReviews");

    if (!product) {
      console.log("Product not found");
      return res.status(404).send({
        success: false,
        message: "Product not found"
      });
    }

    console.log("Product found:", {
      id: product._id,
      reviewsCount: product.reviews ? product.reviews.length : 0,
      averageRating: product.averageRating,
      totalReviews: product.totalReviews
    });

    res.status(200).send({
      success: true,
      message: "Reviews fetched successfully",
      reviews: product.reviews || [],
      averageRating: product.averageRating || 0,
      totalReviews: product.totalReviews || 0
    });
  } catch (error) {
    console.log("Error in getProductReviewsController:", error);
    res.status(500).send({
      success: false,
      message: "Error while getting reviews",
      error: error.message
    });
  }
};

// Get recent updates for real-time notifications
export const recentUpdatesController = async (req, res) => {
  try {
    const updates = [];
    
    // Check for new products in last 5 minutes
    const recentProducts = await productModel.find({
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    }).limit(3);
    
    if (recentProducts.length > 0) {
      updates.push({
        type: 'new_products',
        message: `${recentProducts.length} new product${recentProducts.length > 1 ? 's' : ''} added!`,
        products: recentProducts.map(p => p.name)
      });
    }
    
    // Check for recent orders
    const recentOrders = await orderModel.find({
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    }).populate('buyer', 'name');
    
    if (recentOrders.length > 0) {
      updates.push({
        type: 'new_orders',
        message: `${recentOrders.length} new order${recentOrders.length > 1 ? 's' : ''} placed!`,
        orders: recentOrders.map(o => o.buyer?.name || 'Anonymous')
      });
    }
    
    res.status(200).send({
      success: true,
      message: "Recent updates fetched successfully",
      updates
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting recent updates",
      error
    });
  }
};
