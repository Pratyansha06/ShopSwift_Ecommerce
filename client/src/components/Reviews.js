import React, { useState, useEffect } from "react";
import { useAuth } from "../context/auth";
import { toast } from "react-hot-toast";
import axios from "axios";
import { StarFilled, StarOutlined, UserOutlined, CloseOutlined } from "@ant-design/icons";

const Reviews = ({ productId }) => {
  const [auth] = useAuth();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ""
  });

  // Fetch reviews
  const fetchReviews = async () => {
    if (!productId) return; // Don't fetch if productId is undefined
    
    try {
      const { data } = await axios.get(`/api/v1/product/reviews/${productId}`);
      if (data.success) {
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setTotalReviews(data.totalReviews);
      }
    } catch (error) {
      console.log("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  // Submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!auth?.user) {
      toast.error("Please login to add a review");
      return;
    }

    if (!productId) {
      toast.error("Product not found");
      return;
    }

    if (!newReview.comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`/api/v1/product/review/${productId}`, newReview);
      if (data.success) {
        toast.success("Review added successfully!");
        setNewReview({ rating: 5, comment: "" });
        setShowReviewForm(false);
        // Wait a moment for cache to clear, then fetch reviews
        setTimeout(() => {
          fetchReviews();
        }, 500);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding review");
    } finally {
      setLoading(false);
    }
  };

  // Render stars
  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} style={{ color: index < rating ? '#ffd700' : '#d9d9d9' }}>
        {index < rating ? <StarFilled /> : <StarOutlined />}
      </span>
    ));
  };

  // Check if user has already reviewed
  const hasUserReviewed = reviews.some(review => review.user._id === auth?.user?._id);

  // Don't render if productId is not available
  if (!productId) {
    return (
      <div className="reviews-section" style={{ marginTop: '20px' }}>
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          Loading reviews...
        </div>
      </div>
    );
  }

  return (
    <div className="reviews-section" style={{ marginTop: '20px' }}>
      {/* Already Reviewed Banner */}
      {auth?.user && hasUserReviewed && (
        <div style={{
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#cf1322', fontWeight: '500' }}>
            You have already reviewed this product
          </span>
          <CloseOutlined style={{ color: '#cf1322', cursor: 'pointer' }} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h4 style={{ margin: 0 }}>Customer Reviews</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {renderStars(averageRating)}
            <span style={{ fontSize: '14px', color: '#666' }}>
              {totalReviews > 0 ? `(${totalReviews} review${totalReviews === 1 ? '' : 's'})` : '(0 reviews)'}
            </span>
          </div>
        </div>
        {auth?.user && !hasUserReviewed && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div style={{ 
          border: '1px solid #d9d9d9', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          backgroundColor: '#fafafa'
        }}>
          <h5>Write Your Review</h5>
          <form onSubmit={handleSubmitReview}>
            <div style={{ marginBottom: '15px' }}>
              <label>Rating:</label>
              <div style={{ marginTop: '5px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    style={{ 
                      cursor: 'pointer', 
                      color: star <= newReview.rating ? '#ffd700' : '#d9d9d9',
                      fontSize: '20px',
                      marginRight: '5px'
                    }}
                  >
                    <StarFilled />
                  </span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Comment:</label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '8px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  marginTop: '5px'
                }}
                placeholder="Share your experience with this product..."
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ff4d4f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div>
        {reviews.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No reviews yet. Be the first to review this product!</p>
        ) : (
          reviews.map((review, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #f0f0f0',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px',
                backgroundColor: 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UserOutlined style={{ fontSize: '16px', color: '#666' }} />
                  <span style={{ fontWeight: 'bold' }}>
                    {review.user?.name || 'Anonymous User'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {renderStars(review.rating)}
                </div>
              </div>
              <p style={{ margin: 0, color: '#333' }}>{review.comment}</p>
              <small style={{ color: '#666', marginTop: '10px', display: 'block' }}>
                {new Date(review.date).toLocaleDateString()}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reviews; 