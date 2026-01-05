import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const createIndexes = async () => {
  try {
    console.log("🔍 Connecting to database...");
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017/ecommerce");
    
    console.log("✅ Connected to database successfully!");
    console.log("🔍 Creating database indexes for performance optimization...");
    
    // Get database instance
    const db = mongoose.connection.db;
    
    // Helper function to create index safely
    const createIndexSafely = async (collection, indexSpec, description) => {
      try {
        await db.collection(collection).createIndex(indexSpec);
        console.log(`✅ ${description}`);
      } catch (error) {
        if (error.code === 86) { // Index already exists
          console.log(`⏭️  ${description} (already exists)`);
        } else {
          console.log(`❌ ${description}: ${error.message}`);
        }
      }
    };
    
    // Create indexes for Products collection
    console.log("\n📦 Creating Product indexes...");
    await createIndexSafely("products", { name: "text", description: "text" }, "Text search index");
    await createIndexSafely("products", { slug: 1 }, "Slug lookup index");
    await createIndexSafely("products", { category: 1 }, "Category filtering index");
    await createIndexSafely("products", { price: 1 }, "Price sorting index");
    await createIndexSafely("products", { quantity: 1 }, "Stock filtering index");
    await createIndexSafely("products", { "reviews.user": 1 }, "User review lookup index");
    await createIndexSafely("products", { averageRating: -1 }, "Rating sorting index");
    await createIndexSafely("products", { createdAt: -1 }, "Recent products index");
    await createIndexSafely("products", { "reviews.date": -1 }, "Recent reviews index");
    await createIndexSafely("products", { category: 1, price: 1 }, "Category + Price compound index");
    await createIndexSafely("products", { category: 1, averageRating: -1 }, "Category + Rating compound index");
    await createIndexSafely("products", { price: 1, quantity: 1 }, "Price + Stock compound index");
    
    // Create indexes for Categories collection
    console.log("\n🏷️  Creating Category indexes...");
    await createIndexSafely("categories", { name: 1 }, "Category name lookup index");
    await createIndexSafely("categories", { slug: 1 }, "Category slug lookup index");
    await createIndexSafely("categories", { name: "text" }, "Category text search index");
    
    // Create indexes for Users collection
    console.log("\n👥 Creating User indexes...");
    await createIndexSafely("users", { email: 1 }, "Email lookup index");
    await createIndexSafely("users", { name: 1 }, "Name lookup index");
    await createIndexSafely("users", { role: 1 }, "Role filtering index");
    await createIndexSafely("users", { phone: 1 }, "Phone lookup index");
    await createIndexSafely("users", { email: "text", name: "text" }, "User text search index");
    
    // Create indexes for Orders collection
    console.log("\n📋 Creating Order indexes...");
    await createIndexSafely("orders", { buyer: 1 }, "Buyer orders lookup index");
    await createIndexSafely("orders", { status: 1 }, "Order status filtering index");
    await createIndexSafely("orders", { createdAt: -1 }, "Recent orders index");
    await createIndexSafely("orders", { "payment.method": 1 }, "Payment method filtering index");
    await createIndexSafely("orders", { buyer: 1, status: 1 }, "Buyer + Status compound index");
    await createIndexSafely("orders", { buyer: 1, createdAt: -1 }, "Buyer + Date compound index");
    
    console.log("\n✅ Database indexing completed!");
    console.log("🚀 Your queries will now be significantly faster!");
    
    // Show index statistics
    console.log("\n📊 Index Statistics:");
    const collections = ["products", "categories", "users", "orders"];
    
    for (const collection of collections) {
      const indexes = await db.collection(collection).indexes();
      console.log(`${collection}: ${indexes.length} indexes`);
    }
    
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

createIndexes(); 