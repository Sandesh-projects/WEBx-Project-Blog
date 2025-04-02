import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";
import "./CreateBlogPost.css";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"],
  ],
};

function CreateBlogPost() {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);
  const navigate = useNavigate();
  const { quill, quillRef } = useQuill({
    theme: "snow",
    modules: quillModules,
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");
    if (!userId) {
      toast.error("No user found. Please log in first.");
      return;
    }

    const content = quill ? quill.root.innerHTML : "";

    const newPost = { title, content, image };

    try {
      const response = await fetch(
        `http://localhost:5000/api/user/${userId}/create-post`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPost),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success("Post created successfully!");
        navigate("/home");
      } else {
        toast.error(data.message || "Failed to create post.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while creating the post.");
    }
  };

  return (
    <div className="create-blog-container">
      <ToastContainer />
      <h2>Create a New Blog Post</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter blog title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div
          ref={quillRef}
          style={{ height: "500px", marginBottom: "15px", borderRadius: "4px" }}
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
