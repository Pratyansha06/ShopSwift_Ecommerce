import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cors from "cors";


dotenv.config();


connectDB();


class InMemoryCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    this.defaultTTL = 300000;
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
    this.stats.sets++;
    console.log(`Cache SET (Memory): ${key}`);
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      console.log(`Cache MISS: ${key}`);
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      console.log(`Cache EXPIRED: ${key}`);
      return null;
    }

    this.stats.hits++;
    console.log(`Cache HIT (Memory): ${key}`);
    return item.value;
  }

  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      console.log(`Cache DELETE: ${key}`);
    }
    return deleted;
  }

  clear() {
    this.cache.clear();
    console.log("Cache CLEARED");
  }

  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests * 100).toFixed(2) : 0;
    
    return {
      ...this.stats,
      totalRequests,
      hitRate: parseFloat(hitRate),
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }
}

const cache = new InMemoryCache();


global.cache = cache;

setInterval(() => cache.cleanup(), 600000);

const cacheMiddleware = (ttl = 300000) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl}`;
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    const originalJson = res.json;

    res.json = function(data) {
      cache.set(cacheKey, data, ttl);
      
      return originalJson.call(this, data);
    };

    next();
  };
};

const invalidateCache = (patterns = []) => {
  return (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
      patterns.forEach(pattern => {
        const keys = Array.from(cache.cache.keys());
        keys.forEach(key => {
          if (key.includes(pattern)) {
            cache.delete(key);
          }
        });
      });

      return originalJson.call(this, data);
    };

    next();
  };
};

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));


app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});


app.get("/cache-stats", (req, res) => {
  const stats = cache.getStats();
  res.status(200).json({
    success: true,
    message: "Cache statistics",
    stats
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", cacheMiddleware(180000), categoryRoutes);
app.use("/api/v1/product", cacheMiddleware(300000), productRoutes);


app.get("/", (req, res) => {
  res.send("<h1>Welcome to ecommerce app</h1>");
});


app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: err.message
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: 'Invalid MongoDB ObjectId'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value',
      error: 'This value already exists'
    });
  }

  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});


app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(
    `Server Running on ${process.env.DEV_MODE} mode on port ${PORT}`.bgCyan
      .white
  );
  console.log(`Global error handling enabled - Production ready error management`.yellow);
  console.log(`✅ Using enhanced in-memory cache only`.green);
  console.log(`📊 Cache Statistics Enabled`.green);
});
