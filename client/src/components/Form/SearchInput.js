import React, { useState, useEffect } from "react";
import { useSearch } from "../../context/search";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SearchInput = () => {
  const [search, setSearch] = useSearch();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Real-time search suggestions
  const handleInputChange = async (e) => {
    const keyword = e.target.value;
    setSearch({ ...search, keyword });

    if (keyword.length > 2) {
      try {
        const { data } = await axios.get(`/api/v1/product/search-suggestions/${keyword}`);
        
        // Handle the API response format (array of objects with name and slug)
        const formattedSuggestions = data.map(item => {
          // API returns objects with name and slug properties
          const productName = item.name || item;
          return formatSuggestion(productName);
        });
        
        setSuggestions(formattedSuggestions.slice(0, 5));
        setShowSuggestions(true);
      } catch (error) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Format suggestion text with proper capitalization
  const formatSuggestion = (text) => {
    if (!text) return '';
    
    // Force to lowercase first, then capitalize each word
    const result = text
      .toLowerCase()
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
    
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (search.keyword.trim()) {
      // Save to search history
      const newHistory = [search.keyword, ...searchHistory.filter(item => item !== search.keyword)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));

      try {
        const { data } = await axios.get(
          `/api/v1/product/search/${encodeURIComponent(search.keyword.trim())}`
        );
        setSearch({ ...search, results: data });
        navigate("/search");
        setShowSuggestions(false);
      } catch (error) {
        console.log(error);
        // Handle search error gracefully
        setSearch({ ...search, results: [] });
        navigate("/search");
        setShowSuggestions(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearch({ ...search, keyword: suggestion });
    setShowSuggestions(false);
  };

  const handleHistoryClick = (historyItem) => {
    setSearch({ ...search, keyword: historyItem });
    setShowSuggestions(false);
  };

  return (
    <div className="position-relative" style={{ width: '300px', margin: '0 15px' }}>
      {/* Cleaned up: removed debug info, test buttons, and state test code */}
      <form
        className="d-flex search-form"
        role="search"
        onSubmit={handleSubmit}
        style={{ height: '38px' }}
      >
        <input
          className="form-control"
          type="search"
          placeholder="Search products..."
          aria-label="Search"
          value={search.keyword}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          style={{ 
            width: '220px',
            height: '38px',
            fontSize: '14px',
            padding: '6px 12px',
            border: '1px solid #ced4da',
            borderRadius: '4px 0 0 4px',
            borderRight: 'none'
          }}
        />
        <button 
          className="btn btn-success" 
          type="submit"
          style={{
            height: '38px',
            fontSize: '14px',
            padding: '6px 12px',
            borderRadius: '0 4px 4px 0',
            border: '1px solid #198754',
            borderLeft: 'none'
          }}
        >
          🔍
        </button>
      </form>

      {/* Search Suggestions and History */}
      {showSuggestions && (
        <div className="position-absolute bg-white border rounded shadow-sm" style={{ 
          top: '100%', 
          zIndex: 9999, 
          width: '300px',
          maxHeight: '300px',
          overflowY: 'auto',
          marginTop: '2px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #ddd',
          backgroundColor: 'white'
        }}>
          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <small className="text-muted">Suggestions:</small>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-2 hover-bg-light cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{ 
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    padding: '8px 12px',
                    backgroundColor: 'white'
                  }}
                >
                  🔍 {suggestion}
                </div>
              ))}
            </div>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="p-2 border-top">
              <small className="text-muted">Recent searches:</small>
              {searchHistory.map((item, index) => {
                const formattedItem = formatSuggestion(item);
                return (
                  <div
                    key={index}
                    className="p-2 hover-bg-light cursor-pointer"
                    onClick={() => handleHistoryClick(item)}
                    style={{ 
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      padding: '8px 12px',
                      backgroundColor: 'white'
                    }}
                  >
                    <span style={{ color: '#9aa0a6' }}>🕐</span> {formattedItem}
                  </div>
                );
              })}
            </div>
          )}

          {/* Show message if no suggestions or history */}
          {suggestions.length === 0 && searchHistory.length === 0 && (
            <div className="p-2 text-muted">
              <small>No suggestions available</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
