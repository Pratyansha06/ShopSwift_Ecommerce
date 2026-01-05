import React, { useState, useEffect } from "react";
import AdminMenu from "../../components/Layout/AdminMenu";
import Layout from "./../../components/Layout/Layout";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(6); // Show 6 products per page
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

  //get products for current page
  const getProductsForPage = async (page) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/v1/product/product-list/${page}`);
      setProducts(data.products);
      setFilteredProducts(data.products); // Initialize filtered products
    } catch (error) {
      console.log(error);
      toast.error("Something Went Wrong");
    } finally {
      setLoading(false);
    }
  };

  //get product count
  const getProductCount = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/product-count");
      setProductCount(data?.total);
    } catch (error) {
      console.log(error);
    }
  };

  //delete product
  const handleDelete = async (pid) => {
    try {
      const confirmed = window.confirm("Are you sure you want to delete this product?");
      if (confirmed) {
        const { data } = await axios.delete(`/api/v1/product/delete-product/${pid}`);
        if (data.success) {
          toast.success("Product Deleted Successfully");
          getProductsForPage(currentPage); // Refresh current page
          getProductCount(); // Refresh the count
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.log(error);
      toast.error("Error while deleting product");
    }
  };

  // Search functionality
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.category?.name?.toLowerCase().includes(term)
      );
      setFilteredProducts(filtered);
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(productCount / productsPerPage);

  // Change page
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    getProductsForPage(pageNumber);
    setSearchTerm(""); // Clear search when changing pages
  };

  //lifecycle method
  useEffect(() => {
    getProductsForPage(currentPage);
    getProductCount();
  }, []);

  return (
    <Layout>
      <div className="row dashboard">
        <div className="col-md-3">
          <AdminMenu />
        </div>
        <div className="col-md-9 ">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="mb-0">All Products List</h1>
            <div className="text-end">
              <h5 className="text-muted mb-0">
                Total Products: <span className="text-primary fw-bold">{productCount}</span>
              </h5>
              <small className="text-muted">
                Page {currentPage} of {totalPages} | Showing {products.length} products
              </small>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="input-group" style={{ maxWidth: '400px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search products by name, description, or category..."
                value={searchTerm}
                onChange={handleSearch}
                style={{ 
                  border: '1px solid #ced4da',
                  borderRadius: '4px 0 0 4px',
                  padding: '10px 15px',
                  fontSize: '14px'
                }}
              />
              <button 
                className="btn btn-outline-secondary" 
                type="button"
                style={{ 
                  border: '1px solid #ced4da',
                  borderLeft: 'none',
                  borderRadius: '0 4px 4px 0',
                  padding: '10px 15px'
                }}
              >
                🔍
              </button>
            </div>
            {searchTerm && (
              <small className="text-muted mt-2 d-block">
                Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} matching "{searchTerm}"
              </small>
            )}
          </div>
          
          {loading ? (
            <div className="text-center mt-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading products...</p>
            </div>
          ) : (
            <>
              <div className="d-flex flex-wrap">
                {filteredProducts?.map((p) => (
                  <div key={p._id} className="card m-2" style={{
                    width: "280px",
                    height: "420px",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: 'none',
                    borderRadius: '12px'
                  }}>
                    <div style={{ height: "250px", overflow: "hidden", position: "relative" }}>
                      <img
                        src={p.photo}
                        className="card-img-top"
                        alt={p.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                      />
                      {/* Delete button positioned on top right of image */}
                      <button
                        className="btn btn-danger"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(p._id);
                        }}
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          zIndex: "10",
                          fontSize: "16px",
                          padding: "8px",
                          borderRadius: "4px",
                          border: "none",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                          backgroundColor: "#dc3545",
                          color: "white",
                          width: "40px",
                          height: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="card-body" style={{
                      padding: "15px",
                      height: "170px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}>
                      <div style={{ flex: "1" }}>
                        <h6 className="card-title" style={{
                          fontSize: "15px",
                          marginBottom: "8px",
                          fontWeight: "bold",
                          lineHeight: "1.2",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {p.name}
                        </h6>
                        <p className="card-text" style={{
                          fontSize: "12px",
                          marginBottom: "10px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: "3",
                          WebkitBoxOrient: "vertical",
                          lineHeight: "1.3",
                          height: "46px"
                        }}>
                          {p.description}
                        </p>
                      </div>
                      <div style={{ marginTop: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <div>
                            <p className="card-text" style={{
                              fontSize: "13px",
                              marginBottom: "3px",
                              fontWeight: "bold",
                              color: "#28a745"
                            }}>
                              Price: ${p.price}
                            </p>
                            <p className="card-text" style={{
                              fontSize: "11px",
                              marginBottom: "0",
                              color: "#6c757d"
                            }}>
                              Quantity: {p.quantity}
                            </p>
                          </div>
                          <Link
                            to={`/dashboard/admin/product/${p.slug}`}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                          >
                            ✏️ Update
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination - Only show when not searching */}
              {!searchTerm && totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <nav aria-label="Product pagination">
                    <ul className="pagination">
                      {/* Previous button */}
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          style={{ cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                        >
                          ← Previous
                        </button>
                      </li>

                      {/* Page numbers */}
                      {Array.from({ length: totalPages }, (_, index) => {
                        const pageNumber = index + 1;
                        // Show first page, last page, current page, and pages around current
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <li
                              key={pageNumber}
                              className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}
                            >
                              <button
                                className="page-link"
                                onClick={() => paginate(pageNumber)}
                                style={{
                                  backgroundColor: currentPage === pageNumber ? '#007bff' : '',
                                  color: currentPage === pageNumber ? 'white' : '',
                                  borderColor: currentPage === pageNumber ? '#007bff' : ''
                                }}
                              >
                                {pageNumber}
                              </button>
                            </li>
                          );
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return (
                            <li key={pageNumber} className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          );
                        }
                        return null;
                      })}

                      {/* Next button */}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          style={{ cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                        >
                          Next →
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}

              {/* No products message */}
              {filteredProducts.length === 0 && !loading && (
                <div className="text-center mt-5">
                  <div className="p-4 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                    <h5 className="text-muted mb-3">
                      {searchTerm ? `No products found matching "${searchTerm}"` : 'No products found'}
                    </h5>
                    <p className="text-muted mb-3">
                      {searchTerm ? 'Try a different search term or clear the search.' : 'Start by creating your first product!'}
                    </p>
                    {!searchTerm && (
                      <Link to="/dashboard/admin/create-product" className="btn btn-primary">
                        Create Product
                      </Link>
                    )}
                    {searchTerm && (
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => setSearchTerm("")}
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Products;
