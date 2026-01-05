import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        type: mongoose.ObjectId,
        ref: "Products",
      },
    ],
    payment: {},
    buyer: {
      type: mongoose.ObjectId,
      ref: "Users",
    },
    status: {
      type: String,
      default: "Not Process",
      enum: ["Not Process", "Processing", "Shipped", "delivered", "cancel"],
    },
  },
  { timestamps: true }
);


orderSchema.index({ buyer: 1 }); 
orderSchema.index({ status: 1 }); 
orderSchema.index({ createdAt: -1 }); 
orderSchema.index({ "payment.method": 1 }); 
orderSchema.index({ buyer: 1, status: 1 }); 
orderSchema.index({ buyer: 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);
