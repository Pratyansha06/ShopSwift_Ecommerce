import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

// Database Indexes for Performance Optimization
categorySchema.index({ name: 1 }); 
categorySchema.index({ slug: 1 }); 
categorySchema.index({ name: "text" }); 

export default mongoose.model("Category", categorySchema);
