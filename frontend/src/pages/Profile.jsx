import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

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

  if (error) {
    return <div className="profile-container">{error}</div>;
  }

  if (!user) {
    return <div className="profile-container">Loading...</div>;
  }

  const userPosts = user.posts || [];

  const handlePostClick = (index) => {
    // Navigate to the post detail page (modify route as needed)
    navigate(`/post/${index}`);
  };

  return (
    <div className="profile-container">
      <div className="profile-banner"></div>
      <div className="profile-content">
        <img src="./image.jpg" alt="User" className="profile-pic" />
        <h2 className="profile-name">{user.name}</h2>
        <ul className="profile-details">
          <li>Email: {user.email}</li>
        </ul>
      </div>

      <div className="posts-container">
        <h3>Your Posts</h3>
        {userPosts.length > 0 ? (
          <div className="post-list">
            {userPosts.map((post, index) => (
              <div
                className="post-card"
                key={index}
                onClick={() => handlePostClick(index)}
              >
                {post.image && (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="post-image"
                  />
                )}
                <h4 className="post-title">{post.title}</h4>
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
