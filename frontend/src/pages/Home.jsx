import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BlogCard from "../components/BlogCard";
import UserFunction from "../components/UserFunction";
import "./Home.css";

function Home() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
  // Use a ref so that changes in search input do not cause re-rendering
  const searchInput = useRef();

  const fetchPosts = async (query = "") => {
    try {
      const endpoint = query
        ? `http://localhost:5000/api/search?title=${encodeURIComponent(query)}`
        : "http://localhost:5000/api/posts";
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    // Fetch posts on component mount
    fetchPosts();
  }, []);

  const handleCardClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Get the value from the ref (without updating state on every key stroke)
    const query = searchInput.current.value;
    fetchPosts(query);
  };

  return (
    <div className="home-container">
      <div className="sidebar">
        <UserFunction />
      </div>
      <div className="main-content">
        <div className="search-container">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search posts by title..."
              ref={searchInput}
            />
            <button type="submit">Search</button>
          </form>
        </div>
        <div className="content">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div
                className="blog-card-container"
                key={post.postId}
                onClick={() => handleCardClick(post.postId)}
                style={{
                  cursor: "pointer",
                  // width: "49%",
                }}
              >
                <BlogCard
                  image={post.image || "https://via.placeholder.com/150"}
                  date={
                    post.timestamp
                      ? new Date(post.timestamp).toLocaleDateString()
                      : "N/A"
                  }
                  readTime="2"
                  title={post.title}
                  subtitle={post.content.substring(0, 50) + "..."}
                  views={post.views || Math.floor(Math.random() * 100)}
                  comments={post.comments ? post.comments.length : 0}
                  likes={post.likes || Math.floor(Math.random() * 50)}
                  author={post.author || "Unknown"}
                />
              </div>
            ))
          ) : (
            <p>No posts available</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
