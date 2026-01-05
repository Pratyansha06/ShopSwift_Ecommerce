import { useState, useEffect, useContext, createContext } from "react";
import axios from "axios";

const AuthContext = createContext();
const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    user: null,
    token: "",
  });

  //default axios
  axios.defaults.headers.common["Authorization"] = auth?.token;

  useEffect(() => {
    try {
      const data = localStorage.getItem("auth");
      if (data) {
        const parseData = JSON.parse(data);
        console.log("🔐 Loading auth data:", parseData);
        console.log("👤 User ID:", parseData.user?._id || parseData.user?.id);
        console.log("👤 User name:", parseData.user?.name);
        console.log("👤 User email:", parseData.user?.email);
        console.log("👤 User role:", parseData.user?.role);
        setAuth({
          ...auth,
          user: parseData.user,
          token: parseData.token,
        });
      } else {
        console.log("🔐 No auth data found in localStorage");
      }
    } catch (error) {
      console.error("❌ Error loading auth data:", error);
    }
    //eslint-disable-next-line
  }, []);
  return (
    <AuthContext.Provider value={[auth, setAuth]}>
      {children}
    </AuthContext.Provider>
  );
};

// custom hook
const useAuth = () => useContext(AuthContext);

export { useAuth, AuthProvider };
