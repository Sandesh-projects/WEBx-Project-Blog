import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  // State to track which post options are open; key is postId
  const [openOptions, setOpenOptions] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (userId) {
      fetch(`http://localhost:5000/api/user/${userId}`)
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to fetch user info");
          }
          return res.json();
        })
        .then((data) => {
          setUser(data);
        })
        .catch((err) => {
          setError(err.message);
        });
    } else {
      setError("No userId found in localStorage");
    }
  }, [navigate]);

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  const toggleOptions = (postId) => {
    setOpenOptions((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleDelete = async (postId) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/user/${userId}/delete-post/${postId}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (response.ok) {
        // Remove the deleted post from the UI
        setUser((prevUser) => ({
          ...prevUser,
          posts: prevUser.posts.filter((post) => post.postId !== postId),
        }));
      } else {
        alert(data.message || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("An error occurred while deleting the post.");
    }
  };

  if (error) {
    return <div className="profile-container">{error}</div>;
  }

  if (!user) {
    return <div className="profile-container">Loading...</div>;
  }

  const userPosts = user.posts || [];

  return (
    <div className="profile-container">
      <div className="profile-banner"></div>
      <div className="profile-content">
        {user.profileImage ? (
          <img src={user.profileImage} alt="User" className="profile-pic" />
        ) : (
          <img src="./image.jpg" alt="Default User" className="profile-pic" />
        )}
        <h2 className="profile-name">{user.name}</h2>
        <ul className="profile-details">
          <li>
            <strong>Email:</strong> {user.email}
          </li>
          {user.phone && (
            <li>
              <strong>Phone:</strong> {user.phone}
            </li>
          )}
          {user.education && (
            <li>
              <strong>Education:</strong> {user.education}
            </li>
          )}
          {user.occupation && (
            <li>
              <strong>Occupation:</strong> {user.occupation}
            </li>
          )}
        </ul>
      </div>

      <div className="posts-container">
        <h3>Your Posts</h3>
        {userPosts.length > 0 ? (
          <div className="post-list">
            {userPosts.map((post) => (
              <div className="post-card" key={post.postId}>
                <div className="post-options">
                  <span
                    className="three-dots"
                    onClick={() => toggleOptions(post.postId)}
                  >
                    ⋮
                  </span>
                  {openOptions[post.postId] && (
                    <div className="options-menu">
                      <button onClick={() => handleDelete(post.postId)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <div onClick={() => handlePostClick(post.postId)}>
                  {post.image && (
                    <img
                      src={post.image}
                      alt={post.title}
                      className="post-image"
                    />
                  )}
                  <h4 className="post-title">{post.title}</h4>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>You have no posts yet.</p>
        )}
      </div>
    </div>
  );
}

export default Profile;
