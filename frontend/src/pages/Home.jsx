import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BlogCard from "../components/BlogCard";
import UserFunction from "../components/UserFunction";
import "./Home.css";

function Home() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/posts");
        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchPosts(); // Call only once when the component mounts
  }, []);

  return (
    <div className="home-container">
      <div className="content">
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <div key={index} onClick={() => navigate(`/post/${index}`)}>
              <BlogCard
                image={post.image || "https://via.placeholder.com/150"}
                date="Mar 29, 2025" // Hardcoded for now, update dynamically later
                readTime="2"
                title={post.title}
                subtitle={post.content.substring(0, 50) + "..."}
                views={Math.floor(Math.random() * 100)}
                comments={Math.floor(Math.random() * 10)}
                likes={Math.floor(Math.random() * 50)}
              />
            </div>
          ))
        ) : (
          <p>No posts available</p>
        )}
      </div>
      <div className="sidebar">
        <UserFunction />
      </div>
    </div>
  );
}

export default Home;
