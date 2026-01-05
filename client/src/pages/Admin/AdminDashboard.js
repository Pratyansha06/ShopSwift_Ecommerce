import React, { useState, useEffect } from "react";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "./../../components/Layout/Layout";
import { useAuth } from "../../context/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminDashboard = () => {
  const [auth] = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
  });
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get dashboard data
  useEffect(() => {
    const getDashboardData = async () => {
      try {
        // Get product count
        const productCountRes = await axios.get("/api/v1/product/product-count");
        setStats(prev => ({ ...prev, totalProducts: productCountRes.data.total }));

        // Get category count
        const categoryRes = await axios.get("/api/v1/category/get-category");
        console.log("Categories response:", categoryRes.data);
        console.log("Categories length:", categoryRes.data.category?.length);
        setStats(prev => ({ ...prev, totalCategories: categoryRes.data.category?.length || 0 }));

        // Get orders count
        const ordersRes = await axios.get("/api/v1/auth/all-orders");
        setStats(prev => ({ ...prev, totalOrders: ordersRes.data.length }));

        // Get recent products
        const productsRes = await axios.get("/api/v1/product/product-list/1");
        setRecentProducts(productsRes.data.products.slice(0, 6)); // Show only 6 recent products

        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    getDashboardData();
  }, []);

  return (
    <Layout title={"Admin Dashboard"}>
      <div className="row" style={{ marginTop: "100px" }}>
        <div className="col-md-3">
          <AdminMenu style={{ marginTop: "100px" }} />
        </div>
        <div className="col-md-9 d-flex justify-content-center">
          <div className="card w-100 p-3" style={{ maxWidth: "1200px" }}>
            {/* Header with Admin Details */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="mb-0 text-center flex-grow-1">Admin Dashboard</h3>
              <div className="text-end" style={{ fontSize: '14px', color: '#666' }}>
                <div><strong>Name:</strong> {auth?.user?.name || 'Not Available'}</div>
                <div><strong>Email:</strong> {auth?.user?.email || 'Not Available'}</div>
                <div><strong>Phone:</strong> {auth?.user?.phone || 'Not Available'}</div>
              </div>
            </div>
            
            {/* Analytics Cards */}
            <div className="row mb-4">
              {/* Products Card */}
              <div className="col-md-4">
                <div className="card text-white mb-3" style={{ 
                  backgroundColor: '#2196f3', 
                  borderRadius: '8px',
                  height: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div className="card-body text-center">
                    <h5 className="card-title mb-2" style={{ color: 'white' }}>Products</h5>
                    <p className="card-text" style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: 'white' }}>{stats.totalProducts}</p>
                  </div>
                </div>
              </div>
              
              {/* Categories Card */}
              <div className="col-md-4">
                <div className="card text-white mb-3" style={{ 
                  backgroundColor: '#9c27b0', 
                  borderRadius: '8px',
                  height: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div className="card-body text-center">
                    <h5 className="card-title mb-2" style={{ color: 'white' }}>Categories</h5>
                    <p className="card-text" style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: 'white' }}>
                      {stats.totalCategories || 0}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Orders Card */}
              <div className="col-md-4">
                <div className="card text-white mb-3" style={{ 
                  backgroundColor: '#ff9800', 
                  borderRadius: '8px',
                  height: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div className="card-body text-center">
                    <h5 className="card-title mb-2" style={{ color: 'white' }}>Orders</h5>
                    <p className="card-text" style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: 'white' }}>{stats.totalOrders}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Products Section */}
            <h4 className="mb-3">Recent Products</h4>
            {loading ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="row">
                {recentProducts.length > 0 ? (
                  recentProducts.map((p) => (
                    <div key={p._id} className="col-md-4 mb-3">
                      <div className="card h-100 shadow-sm" style={{ borderRadius: '8px' }}>
                        <div className="product-image-container" style={{ height: "180px", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f0f0f0", borderRadius: '8px 8px 0 0' }}>
                          <img
                            src={p.photo}
                            className="card-img-top"
                            alt={p.name}
                            style={{ objectFit: "contain", maxHeight: "100%", maxWidth: "100%" }}
                          />
                        </div>
                        <div className="card-body">
                          <h6 className="card-title text-truncate">{p.name}</h6>
                          <p className="card-text text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                            {p.description.substring(0, 50)}...
                          </p>
                          <p className="card-text"><strong>Price: ${p.price}</strong></p>
                          <p className="card-text">Stock: {p.quantity}</p>
                          <p className="card-text">Category: {p.category?.name}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-center text-muted">No recent products found.</div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <h4 className="mb-3 mt-4">Quick Actions</h4>
            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-outline-primary" onClick={() => navigate("/dashboard/admin/create-category")}>
                Create Category
              </button>
              <button className="btn btn-outline-success" onClick={() => navigate("/dashboard/admin/create-product")}>
                Add Product
              </button>
              <button className="btn btn-outline-info" onClick={() => navigate("/dashboard/admin/products")}>
                Manage Products
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
