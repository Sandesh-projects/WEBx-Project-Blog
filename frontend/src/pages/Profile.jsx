import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTrashAlt, FaEdit } from "react-icons/fa"; // Import icons for delete and update
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  // State to track which post options are open; key is postId (for post deletion/update)
  const [openOptions, setOpenOptions] = useState({});
  // State to control the profile options menu (for updating profile)
  const [openProfileOptions, setOpenProfileOptions] = useState(false);
  // State to control the update modal visibility and form data for user details
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateData, setUpdateData] = useState({
    name: "",
    phone: "",
    education: "",
    occupation: "",
    profileImage: "",
  });

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
          // Pre-fill the update form with current details
          setUpdateData({
            name: data.name,
            phone: data.phone || "",
            education: data.education || "",
            occupation: data.occupation || "",
            profileImage: data.profileImage || "",
          });
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

  // Toggle options menu for an individual post
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

  const handleUpdatePost = (postId) => {
    // Navigate to the UpdateBlogPost page with the postId as state or query param.
    // You can implement this page similar to CreateBlogPost.jsx but pre-filled with the post's details.
    navigate(`/update-post/${postId}`);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");
    try {
      const response = await fetch(
        `http://localhost:5000/api/user/${userId}/update`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setUser((prev) => ({ ...prev, ...updateData }));
        setUpdateModalVisible(false);
        setOpenProfileOptions(false);
        alert(data.message);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error updating profile", error);
      alert("An error occurred while updating your profile.");
    }
  };

  const handleUpdateChange = (field, value) => {
    setUpdateData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdateChange("profileImage", reader.result);
      };
      reader.readAsDataURL(file);
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
        {/* Profile Options Button */}
        <div
          className="profile-options"
          onClick={() => setOpenProfileOptions((prev) => !prev)}
        >
          ⋮
          {openProfileOptions && (
            <div className="profile-options-menu">
              <button
                className="profile-option-button"
                onClick={() => setUpdateModalVisible(true)}
              >
                <FaEdit style={{ marginRight: "6px" }} /> Update Profile
              </button>
            </div>
          )}
        </div>
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
                    <div className="options-menu" style={{ width: "90px" }}>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(post.postId)}
                      >
                        <FaTrashAlt style={{ marginRight: "6px" }} /> Delete
                      </button>
                      <hr className="options-divider" />
                      <button
                        className="update-button"
                        onClick={() => handleUpdatePost(post.postId)}
                      >
                        <FaEdit style={{ marginRight: "6px" }} /> Update
                      </button>
                    </div>
                  )}
                </div>
                <div
                  className="post-card-content"
                  onClick={() => handlePostClick(post.postId)}
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
              </div>
            ))}
          </div>
        ) : (
          <p>You have no posts yet.</p>
        )}
      </div>

      {updateModalVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Update Profile</h3>
            <form onSubmit={handleUpdateProfile} className="update-form">
              <label>Name:</label>
              <input
                type="text"
                value={updateData.name}
                onChange={(e) => handleUpdateChange("name", e.target.value)}
                required
              />
              <label>Phone:</label>
              <input
                type="text"
                value={updateData.phone}
                onChange={(e) => handleUpdateChange("phone", e.target.value)}
              />
              <label>Education:</label>
              <input
                type="text"
                value={updateData.education}
                onChange={(e) =>
                  handleUpdateChange("education", e.target.value)
                }
              />
              <label>Occupation:</label>
              <input
                type="text"
                value={updateData.occupation}
                onChange={(e) =>
                  handleUpdateChange("occupation", e.target.value)
                }
              />
              <label>Profile Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={() => {
                    setUpdateModalVisible(false);
                    setOpenProfileOptions(false);
                  }}
                  style={{ backgroundColor: "red", color: "white" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: "green", color: "white" }}
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
