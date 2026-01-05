import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout/Layout";
import { useSearch } from "../context/search";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import { Checkbox, Radio } from "antd";
import { Prices } from "../components/Prices";
import axios from "axios";
import toast from "react-hot-toast";
import { StarFilled, StarOutlined } from "@ant-design/icons";

const Search = () => {
  const [search, setSearch] = useSearch();
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  
  // Load saved state from localStorage or use defaults
  const getSavedState = () => {
    const saved = localStorage.getItem('searchFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.log('Error parsing saved filters:', e);
      }
    }
    return {
      sortBy: "relevance",
      checked: [],
      radio: []
    };
  };

  const savedState = getSavedState();
  const [sortBy, setSortBy] = useState(savedState.sortBy);
  const [categories, setCategories] = useState([]);
  const [checked, setChecked] = useState(savedState.checked);
  const [radio, setRadio] = useState(savedState.radio);
  const [filteredResults, setFilteredResults] = useState([]);

  // Render stars helper function
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} style={{ color: index < rating ? '#ffd700' : '#d9d9d9' }}>
        {index < rating ? <StarFilled /> : <StarOutlined />}
      </span>
    ));
  };

  // Load categories
  useEffect(() => {
    const getAllCategory = async () => {
      try {
        const { data } = await axios.get("/api/v1/category/get-category");
        if (data?.success) {
          setCategories(data?.category);
        }
      } catch (error) {
        console.log(error);
      }
    };
    getAllCategory();
  }, []);

  // Initialize filtered results when search results change
  useEffect(() => {
    if (search?.results) {
      console.log("Search results received:", search.results.length, "products");
      setFilteredResults(search.results);
    }
  }, [search?.results]);

  // Add to cart function
  const addToCart = (product) => {
    setCart([...cart, product]);
    // localStorage is now handled by the cart context
    toast.success("Item Added to cart");
  };

  // Save state to localStorage
  const saveState = (newSortBy, newChecked, newRadio) => {
    const stateToSave = {
      sortBy: newSortBy,
      checked: newChecked,
      radio: newRadio
    };
    localStorage.setItem('searchFilters', JSON.stringify(stateToSave));
  };

  // Handle category filter
  const handleFilter = (value, id) => {
    let all = [...checked];
    if (value) {
      all.push(id);
    } else {
      all = all.filter((c) => c !== id);
    }
    setChecked(all);
    saveState(sortBy, all, radio);
  };

  // Apply filters to search results
  useEffect(() => {
    if (!search?.results) return;

    let filtered = [...search.results];

    // Apply category filter
    if (checked.length > 0) {
      filtered = filtered.filter(product => 
        checked.includes(product.category._id || product.category)
      );
    }

    // Apply price filter
    if (radio.length > 0) {
      filtered = filtered.filter(product => 
        product.price >= radio[0] && product.price <= radio[1]
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "rating-high":
        filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case "rating-low":
        filtered.sort((a, b) => (a.averageRating || 0) - (b.averageRating || 0));
        break;
      default:
        // Keep original order for relevance
        break;
    }

    setFilteredResults(filtered);
  }, [search?.results, checked, radio, sortBy]);

  // Reset filters
  const resetFilters = () => {
    setChecked([]);
    setRadio([]);
    setSortBy("relevance");
    // Clear saved state
    localStorage.removeItem('searchFilters');
  };

  return (
    <Layout title={"Search results"}>
      <div className="container-fluid" style={{ marginTop: '80px' }}>
        <div className="row">
          {/* Search Results Header */}
          <div className="col-12 mb-4">
            <div className="d-flex justify-content-between align-items-center" style={{ paddingTop: '40px' }}>
              <div>
                <h1 className="mb-2">Search Results</h1>
                <h6 className="text-muted mb-0">
                  {filteredResults.length < 1
                    ? "No Products Found"
                    : `Found ${filteredResults.length} products`}
                </h6>
              </div>
              
              {/* Search Analytics */}
              <div className="text-end">
                <small className="text-muted">
                  Search term: <strong>"{search?.keyword}"</strong>
                </small>
              </div>
            </div>
          </div>

          {/* Filters Sidebar */}
          <div className="col-md-3">
            <div className="filters p-4 border rounded shadow-sm" style={{ backgroundColor: '#f8f9fa' }}>
              
              {/* Sort Options - Put First */}
              <div className="mb-4">
                <h5 className="text-center mb-3" style={{ color: '#495057', fontWeight: '600' }}>
                  🔄 Sort By
                </h5>
                <select 
                  className="form-select form-select-lg" 
                  value={sortBy}
                  onChange={(e) => {
                    const newSortBy = e.target.value;
                    setSortBy(newSortBy);
                    saveState(newSortBy, checked, radio);
                  }}
                  style={{ fontSize: '14px' }}
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                  <option value="rating-high">Rating: High to Low</option>
                  <option value="rating-low">Rating: Low to High</option>
                </select>
              </div>

              <hr className="my-4" />

              {/* Category Filter */}
              <div className="mb-4">
                <h5 className="text-center mb-3" style={{ color: '#495057', fontWeight: '600' }}>
                  📂 Filter By Category
                </h5>
                <div className="d-flex flex-column" style={{ gap: '8px' }}>
                  {categories?.map((c) => (
                    <Checkbox
                      key={c._id}
                      checked={checked.includes(c._id)}
                      onChange={(e) => handleFilter(e.target.checked, c._id)}
                      style={{ fontSize: '14px' }}
                    >
                      {c.name}
                    </Checkbox>
                  ))}
                </div>
              </div>

              <hr className="my-4" />

              {/* Price Filter */}
              <div className="mb-4">
                <h5 className="text-center mb-3" style={{ color: '#495057', fontWeight: '600' }}>
                  💰 Filter By Price
                </h5>
                <div className="d-flex flex-column" style={{ gap: '8px' }}>
                  <Radio.Group onChange={(e) => {
                    const newRadio = e.target.value;
                    setRadio(newRadio);
                    saveState(sortBy, checked, newRadio);
                  }}>
                    {Prices?.map((p) => (
                      <div key={p._id} style={{ marginBottom: '6px' }}>
                        <Radio value={p.array} style={{ fontSize: '14px' }}>
                          {p.name}
                        </Radio>
                      </div>
                    ))}
                  </Radio.Group>
                </div>
              </div>

              <hr className="my-4" />

              {/* Reset Button */}
              <div className="d-flex flex-column">
                <button
                  className="btn btn-danger btn-lg"
                  onClick={resetFilters}
                  style={{ fontWeight: '600' }}
                >
                  🔄 RESET FILTERS
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="col-md-9">
            <div className="d-flex flex-wrap justify-content-start" style={{ gap: '20px' }}>
              {filteredResults.map((p) => (
                <div key={p._id} className="card" style={{ 
                  width: "280px", 
                  height: "450px",
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: 'none',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '20px'
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
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div 
                      style={{
                        display: 'none',
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#f8f9fa",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        color: "#6c757d",
                        position: "absolute",
                        top: 0,
                        left: 0
                      }}
                    >
                      📷 Image
                    </div>
                  </div>
                  <div className="card-body" style={{
                    padding: "15px",
                    height: "200px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}>
                    <div>
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
                      {/* Rating Display */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                        {renderStars(p.averageRating || 0)}
                        <span style={{ fontSize: '11px', color: '#666' }}>
                          ({p.totalReviews || 0} reviews)
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="card-text" style={{
                        fontSize: "16px",
                        marginBottom: "8px",
                        fontWeight: "bold",
                        color: "#28a745"
                      }}>
                        ${p.price}
                      </p>
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate(`/product/${p.slug}`)}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          View Details
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => addToCart(p)}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results Message */}
            {filteredResults.length === 0 && search?.results.length > 0 && (
              <div className="text-center mt-5">
                <div className="p-4 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                  <p className="text-muted mb-3">No products match your current filters.</p>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={resetFilters}
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;
