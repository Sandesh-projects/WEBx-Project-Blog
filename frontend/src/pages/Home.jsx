import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BlogCard from "../components/BlogCard";
import UserFunction from "../components/UserFunction";
import "./Home.css";

function Home() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();
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
    fetchPosts();
  }, []);

  const handleCardClick = async (postId) => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      try {
        await fetch(`http://localhost:5000/api/post/${postId}/add-view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      } catch (err) {
        console.error("Failed to add view:", err);
      }
    }
    navigate(`/post/${postId}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
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
                  views={post.views || 0}
                  comments={post.comments ? post.comments.length : 0}
                  likes={post.likes || 0}
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
