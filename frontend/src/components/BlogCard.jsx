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
  author = "Unknown",
}) {
  return (
    <div className="blog-card">
      <div className="blog-image-container">
        {image && <img src={image} alt={title} className="blog-image" />}
      </div>
      <div className="blog-content">
        <h3 className="blog-title">{title}</h3>
        {/* {subtitle && <p className="blog-subtitle">{subtitle}</p>} */}
        <div className="blog-footer">
          <div className="footer-left">
            <p className="blog-meta">
              {date} | Author : {author}
            </p>
          </div>
          <div className="footer-right">
            <span className="views">{views} views</span>
            <span className="comments">{comments} comments</span>
            <span className="likes">
              {likes} <span className="heart-icon">♥</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlogCard;
