import React, { useState, useEffect } from "react";
import Layout from "../components/Layout/Layout";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/CategoryProductStyles.css";
import axios from "axios";
import { StarFilled, StarOutlined } from "@ant-design/icons";
const CategoryProduct = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState([]);
  
  // Load saved sort state from localStorage or use default
  const getSavedSortState = () => {
    const saved = localStorage.getItem('categorySort');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.log('Error parsing saved sort:', e);
      }
    }
    return "relevance";
  };

  const [sortBy, setSortBy] = useState(getSavedSortState());

  // Render stars helper function
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} style={{ color: index < rating ? '#ffd700' : '#d9d9d9' }}>
        {index < rating ? <StarFilled /> : <StarOutlined />}
      </span>
    ));
  };

  useEffect(() => {
    if (params?.slug) getPrductsByCat();
  }, [params?.slug]);
  const getPrductsByCat = async () => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/product-category/${params.slug}`
      );
      setProducts(data?.products);
      setCategory(data?.category);
    } catch (error) {
      console.log(error);
    }
  };

  // Save sort state to localStorage
  const saveSortState = (newSortBy) => {
    localStorage.setItem('categorySort', JSON.stringify(newSortBy));
  };

  // Apply sorting to products
  useEffect(() => {
    if (!products.length) return;

    let sortedProducts = [...products];

    switch (sortBy) {
      case "price-low":
        sortedProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        sortedProducts.sort((a, b) => b.price - a.price);
        break;
      case "name":
        sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "rating-high":
        sortedProducts.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case "rating-low":
        sortedProducts.sort((a, b) => (a.averageRating || 0) - (b.averageRating || 0));
        break;
      default:
        // Keep original order for relevance
        break;
    }

    setProducts(sortedProducts);
  }, [sortBy]);

  return (
    <Layout>
      <div className="container mt-3 category">
        <h4 className="text-center">Category - {category?.name}</h4>
        <h6 className="text-center">{products?.length} result found </h6>
        
        {/* Sort Dropdown */}
        <div className="row mb-3">
          <div className="col-md-6 offset-md-3">
            <div className="d-flex align-items-center">
              <label className="me-2 fw-bold">Sort by:</label>
              <select 
                className="form-select" 
                value={sortBy}
                onChange={(e) => {
                  const newSortBy = e.target.value;
                  setSortBy(newSortBy);
                  saveSortState(newSortBy);
                }}
                style={{ maxWidth: '200px' }}
              >
                <option value="relevance">Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
                <option value="rating-high">Rating: High to Low</option>
                <option value="rating-low">Rating: Low to High</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="row">
          <div className="col-md-9 offset-1">
            <div className="d-flex flex-wrap">
              {products?.map((p) => (
                <div className="card m-2" key={p._id}>
                  <img
                    src={p.photo}
                    className="card-img-top"
                    alt={p.name}
                  />
                  <div className="card-body">
                    <div className="card-name-price">
                      <h5 className="card-title">{p.name}</h5>
                      <h5 className="card-title card-price">
                        {p.price.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </h5>
                    </div>
                    <p className="card-text ">
                      {p.description.substring(0, 60)}...
                    </p>
                    {/* Rating Display */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                      {renderStars(p.averageRating || 0)}
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        ({p.totalReviews || 0} reviews)
                      </span>
                    </div>
                    <div className="card-name-price">
                      <button
                        className="btn btn-info ms-1"
                        onClick={() => navigate(`/product/${p.slug}`)}
                      >
                        More Details
                      </button>
                      {/* <button
                    className="btn btn-dark ms-1"
                    onClick={() => {
                      setCart([...cart, p]);
                      localStorage.setItem(
                        "cart",
                        JSON.stringify([...cart, p])
                      );
                      toast.success("Item Added to cart");
                    }}
                  >
                    ADD TO CART
                  </button> */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* <div className="m-2 p-3">
            {products && products.length < total && (
              <button
                className="btn btn-warning"
                onClick={(e) => {
                  e.preventDefault();
                  setPage(page + 1);
                }}
              >
                {loading ? "Loading ..." : "Loadmore"}
              </button>
            )}
          </div> */}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryProduct;
