import React from "react";
import "./BlogCard.css";

function BlogCard({
  image,
  date = "Mar 23, 2023",
  readTime = "1",
  title = "Sample Blog Title",
  subtitle = "Sample subtitle for the blog post...",
  views = 0,
  comments = 0,
  likes = 0,
}) {
  return (
    <div className="blog-card">
      <div className="blog-image-container">
        {/* If an image URL is provided, display it. Otherwise, keep empty space. */}
        {image && <img src={image} alt={title} className="blog-image" />}
      </div>
      <div className="blog-content">
        <p className="blog-meta">
          {date} | {readTime} min read
        </p>
        <h3 className="blog-title">{title}</h3>
        <p className="blog-subtitle">{subtitle}</p>
        <div className="blog-stats">
          <span>{views} views</span>
          <span>{comments} comments</span>
          <span>
            {likes} <span className="heart-icon">♥</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default BlogCard;
