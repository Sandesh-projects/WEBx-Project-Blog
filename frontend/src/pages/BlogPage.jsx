import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./BlogPage.css";

function BlogPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [commenter, setCommenter] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState([]);
  // State for reply forms; each key is a commentId with boolean visibility
  const [replyVisible, setReplyVisible] = useState({});
  // State for reply input values per commentId
  const [replyData, setReplyData] = useState({});

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/post/${postId}`
        );
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
    };
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commenter || !commentContent) {
      alert("Please enter your name and comment.");
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/post/${postId}/add-comment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commenter, content: commentContent }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setComments([...comments, data.comment]);
        setCommenter("");
        setCommentContent("");
      } else {
        alert(data.message || "Failed to add comment.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while adding the comment.");
    }
  };

  const toggleReplyForm = (commentId) => {
    setReplyVisible((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleReplyChange = (commentId, field, value) => {
    setReplyData((prev) => ({
      ...prev,
      [commentId]: { ...prev[commentId], [field]: value },
    }));
  };

  const handleAddReply = async (commentId) => {
    const replyInfo = replyData[commentId];
    if (!replyInfo || !replyInfo.replyCommenter || !replyInfo.replyContent) {
      alert("Please enter your name and reply content.");
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
            replyCommenter: replyInfo.replyCommenter,
            replyContent: replyInfo.replyContent,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        // Update the specific comment's replies locally
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
        // Clear the reply inputs and hide the form
        setReplyData((prev) => ({
          ...prev,
          [commentId]: { replyCommenter: "", replyContent: "" },
        }));
        setReplyVisible((prev) => ({ ...prev, [commentId]: false }));
      } else {
        alert(data.message || "Failed to add reply.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while adding the reply.");
    }
  };

  if (error) {
    return (
      <div className="blog-page-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="blog-page-container loading">
        <div className="spinner"></div>
        <p>Loading post...</p>
      </div>
    );
  }

  const { title, image, content, timestamp, author } = post;

  return (
    <div className="blog-page-container">
      <button onClick={() => navigate("/home")} className="back-btn">
        ← Back to Home
      </button>
      <div className="blog-page-header">
        <h1>{title}</h1>
        <p className="blog-page-author">by {author || "Unknown"}</p>
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
      <div className="blog-page-content">
        <p>{content}</p>
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
                {/* Replies */}
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
                    <input
                      type="text"
                      placeholder="Your name"
                      value={
                        (replyData[comment.commentId] &&
                          replyData[comment.commentId].replyCommenter) ||
                        ""
                      }
                      onChange={(e) =>
                        handleReplyChange(
                          comment.commentId,
                          "replyCommenter",
                          e.target.value
                        )
                      }
                      required
                    />
                    <textarea
                      placeholder="Your reply..."
                      value={
                        (replyData[comment.commentId] &&
                          replyData[comment.commentId].replyContent) ||
                        ""
                      }
                      onChange={(e) =>
                        handleReplyChange(
                          comment.commentId,
                          "replyContent",
                          e.target.value
                        )
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
          <input
            type="text"
            placeholder="Your name"
            value={commenter}
            onChange={(e) => setCommenter(e.target.value)}
            required
          />
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
  );
}

export default BlogPage;
