import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import UserFunction from "../components/UserFunction";
import "./BlogPage.css";

function BlogPage() {
  const { postId } = useParams();
  const navigate = useNavigate();

  // State declarations
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState([]);
  const [replyVisible, setReplyVisible] = useState({});
  const [replyData, setReplyData] = useState({});

  // Helper to fetch post data
  const fetchPostData = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/post/${postId}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to fetch post");
      }
      const data = await response.json();
      setPost(data);
      setComments(data.comments || []);
    } catch (err) {
      setError(err.message);
    }
  }, [postId]);

  useEffect(() => {
    if (postId) {
      fetchPostData();
    }
  }, [postId, fetchPostData]);

  // Helper to update post data after like/dislike toggles
  const refreshPost = async () => {
    try {
      const refreshed = await fetch(`http://localhost:5000/api/post/${postId}`);
      const data = await refreshed.json();
      setPost(data);
    } catch (err) {
      console.error("Error refreshing post:", err);
    }
  };

  // Add comment handler
  const handleAddComment = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");
    if (!userId || !commentContent) {
      alert("Please log in and enter comment content.");
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/post/${postId}/add-comment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, content: commentContent }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setComments([...comments, data.comment]);
        setCommentContent("");
      } else {
        alert(data.message || "Failed to add comment.");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("An error occurred while adding the comment.");
    }
  };

  // Toggle reply form visibility
  const toggleReplyForm = (commentId) => {
    setReplyVisible((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  // Handle reply content changes
  const handleReplyChange = (commentId, value) => {
    setReplyData((prev) => ({
      ...prev,
      [commentId]: { replyContent: value },
    }));
  };

  // Add reply handler
  const handleAddReply = async (commentId) => {
    const replyInfo = replyData[commentId];
    if (!replyInfo || !replyInfo.replyContent) {
      alert("Please enter your reply content.");
      return;
    }
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Please log in to reply.");
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/post/${postId}/add-reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commentId,
            userId,
            replyContent: replyInfo.replyContent,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        // Update comments with the new reply
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.commentId === commentId
              ? {
                  ...comment,
                  replies: comment.replies
                    ? [...comment.replies, data.reply]
                    : [data.reply],
                }
              : comment
          )
        );
        // Reset reply input and hide the form
        setReplyData((prev) => ({
          ...prev,
          [commentId]: { replyContent: "" },
        }));
        setReplyVisible((prev) => ({ ...prev, [commentId]: false }));
      } else {
        alert(data.message || "Failed to add reply.");
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      alert("An error occurred while adding the reply.");
    }
  };

  // Toggle like for post
  const handleToggleLike = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Please log in to like posts.");
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/post/${postId}/toggle-like`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );
      if (response.ok) {
        refreshPost();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to toggle like");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  // Toggle dislike for post
  const handleToggleDislike = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Please log in to dislike posts.");
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/post/${postId}/toggle-dislike`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );
      if (response.ok) {
        refreshPost();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to toggle dislike");
      }
    } catch (error) {
      console.error("Error toggling dislike:", error);
    }
  };

  // Render error state if one exists
  if (error) {
    return (
      <div className="blog-page-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  // Render a loading state if the post hasn't been fetched yet
  if (!post) {
    return (
      <div className="blog-page-container loading">
        <div className="spinner"></div>
        <p>Loading post...</p>
      </div>
    );
  }

  const {
    title,
    image,
    content,
    timestamp,
    author,
    likes = 0,
    dislikes = 0,
  } = post;

  return (
    <div className="blog-page" style={{ display: "flex" }}>
      <div className="sidebar" style={{ flex: "0 0 20%" }}>
        <UserFunction />
      </div>
      <div className="blog-page-container">
        <button onClick={() => navigate("/home")} className="back-btn">
          ← Back to Home
        </button>
        <div className="blog-page-header">
          <h1>{title}</h1>
          <p
            className="blog-page-author"
            style={{ textDecorationLine: "underline" }}
          >
            Author : {author || "Unknown"}
          </p>
          {timestamp && (
            <p className="blog-page-meta">
              Published on: {new Date(timestamp).toLocaleString()}
            </p>
          )}
        </div>
        {image ? (
          <img src={image} alt={title} className="blog-page-image" />
        ) : (
          <div className="image-placeholder">No Image Available</div>
        )}
        <hr />
        <div
          className="blog-page-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        <div className="like-dislike-container">
          <button
            onClick={handleToggleLike}
            className="like-btn"
            style={{ background: "none", color: "black" }}
          >
            <FaThumbsUp style={{ marginRight: "6px" }} />
            {likes}
          </button>
          <button
            onClick={handleToggleDislike}
            className="dislike-btn"
            style={{ background: "none", color: "black" }}
          >
            <FaThumbsDown style={{ marginRight: "6px" }} />
            {dislikes}
          </button>
        </div>
        <div className="comments-section">
          <h3>Comments</h3>
          {comments.length > 0 ? (
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.commentId} className="comment-card">
                  <p className="commenter-name">{comment.commenter}</p>
                  <p className="comment-content">{comment.content}</p>
                  <p className="comment-timestamp">
                    {new Date(comment.timestamp).toLocaleString()}
                  </p>
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="replies-list">
                      {comment.replies.map((reply) => (
                        <div key={reply.replyId} className="reply-card">
                          <p className="reply-commenter">
                            {reply.replyCommenter}
                          </p>
                          <p className="reply-content">{reply.replyContent}</p>
                          <p className="reply-timestamp">
                            {new Date(reply.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => toggleReplyForm(comment.commentId)}
                    className="reply-btn"
                  >
                    {replyVisible[comment.commentId] ? "Cancel" : "Reply"}
                  </button>
                  {replyVisible[comment.commentId] && (
                    <div className="reply-form">
                      <textarea
                        placeholder="Your reply..."
                        value={replyData[comment.commentId]?.replyContent || ""}
                        onChange={(e) =>
                          handleReplyChange(comment.commentId, e.target.value)
                        }
                        required
                      />
                      <button
                        onClick={() => handleAddReply(comment.commentId)}
                        className="submit-reply-btn"
                      >
                        Submit Reply
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No comments yet.</p>
          )}
          <form onSubmit={handleAddComment} className="comment-form">
            <textarea
              placeholder="Add a comment..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              required
            />
            <button type="submit">Submit Comment</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BlogPage;
