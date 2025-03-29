import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateBlogPost.css";

function CreateBlogPost() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const navigate = useNavigate();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result); // base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("No user found. Please log in first.");
      return;
    }

    // Prepare the post data
    const newPost = { title, content, image };

    try {
      const response = await fetch(
        `http://localhost:5000/api/user/${userId}/create-post`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newPost),
        }
      );

      const data = await response.json();
      if (response.ok) {
        // Post successfully saved
        console.log("New Post Saved:", data);
        alert("Post created successfully!");
        navigate("/home");
      } else {
        // Some error from the backend
        alert(data.message || "Failed to create post.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while creating the post.");
    }
  };

  return (
    <div className="create-blog-container">
      <h2>Create a New Blog Post</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter blog title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Write your content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {image && <img src={image} alt="Preview" className="image-preview" />}
        <button type="submit" className="publish-btn">
          Publish
        </button>
      </form>
    </div>
  );
}

export default CreateBlogPost;
