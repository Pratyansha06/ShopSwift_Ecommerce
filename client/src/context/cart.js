import { useState, useContext, createContext, useEffect } from "react";
import { useAuth } from "./auth";

const CartContext = createContext();
const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [auth] = useAuth();

  // Get user-specific cart key with better error handling
  const getCartKey = () => {
    try {
      // Use _id (MongoDB default) or id if available
      const userId = auth?.user?._id || auth?.user?.id;
      
      if (userId) {
        const cartKey = `cart_${userId}`;
        console.log("🔑 Generated cart key:", cartKey, "for user:", auth?.user?.name || auth?.user?.email);
        console.log("👤 User details:", { id: userId, name: auth?.user?.name, email: auth?.user?.email, role: auth?.user?.role });
        return cartKey;
      }
      
      console.log("👤 Guest user - using cart_guest");
      console.log("🔍 Auth state:", auth);
      return "cart_guest"; // For non-logged in users
    } catch (error) {
      console.error("❌ Error generating cart key:", error);
      return "cart_guest";
    }
  };

  useEffect(() => {
    try {
      const cartKey = getCartKey();
      console.log("🛒 Loading cart for key:", cartKey);
      console.log("👤 Current user:", auth?.user);
      
      // Clean up old global cart data if user is logged in
      if (auth?.user?._id || auth?.user?.id) {
        const oldCart = localStorage.getItem("cart");
        if (oldCart) {
          console.log("🧹 Cleaning up old global cart data");
          localStorage.removeItem("cart");
        }
      }
      
      let existingCartItem = localStorage.getItem(cartKey);
      if (existingCartItem) {
        const parsedCart = JSON.parse(existingCartItem);
        console.log("📦 Loaded existing cart with", parsedCart.length, "items");
        console.log("📋 Cart items:", parsedCart.map(item => item.name));
        setCart(parsedCart);
      } else {
        console.log("🆕 No existing cart found, starting with empty cart");
        setCart([]);
      }
    } catch (error) {
      console.error("❌ Error loading cart:", error);
      setCart([]);
    }
  }, [auth?.user?._id, auth?.user?.id]); // Re-run when user changes

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      const cartKey = getCartKey();
      console.log("💾 Saving cart with", cart.length, "items to key:", cartKey);
      console.log("📋 Items being saved:", cart.map(item => item.name));
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch (error) {
      console.error("❌ Error saving cart:", error);
    }
  }, [cart, auth?.user?._id, auth?.user?.id]);

  return (
    <CartContext.Provider value={[cart, setCart]}>
      {children}
    </CartContext.Provider>
  );
};

// custom hook
const useCart = () => useContext(CartContext);

export { useCart, CartProvider };
