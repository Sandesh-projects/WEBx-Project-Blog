import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./UserFunction.css";

function UserFunction() {
  const navigate = useNavigate();

  return (
    <>
      <button className="new-post-btn" onClick={() => navigate("/create-post")}>
        + NEW POST
      </button>
      <nav className="menu">
        <Link to="/posts" className="menu-item">
          📄 Posts
        </Link>
        <Link to="/comments" className="menu-item">
          💬 Comments
        </Link>
        <Link to="/pages" className="menu-item">
          📄 Pages
        </Link>
        <Link to="/theme" className="menu-item">
          🎨 Theme
        </Link>
        <Link to="/settings" className="menu-item">
          ⚙️ Settings
        </Link>
        <Link to="/view-blog" className="menu-item">
          🔗 View Blog
        </Link>
      </nav>
    </>
  );
}

export default UserFunction;
