import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    role: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }); 
userSchema.index({ name: 1 }); 
userSchema.index({ role: 1 }); 
userSchema.index({ phone: 1 }); 
userSchema.index({ email: "text", name: "text" });

export default mongoose.model("Users", userSchema);
