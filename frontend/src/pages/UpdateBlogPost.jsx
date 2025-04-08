import React, { useEffect, useState } from "react";
import { useQuill } from "react-quilljs";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-quill/dist/quill.snow.css";
import "react-toastify/dist/ReactToastify.css";
import "./CreateBlogPost.css"; // You may reuse the CreateBlogPost styles

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"],
  ],
};

function UpdateBlogPost() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);
  // Initialize ReactQuill with useQuill hook
  const { quill, quillRef } = useQuill({
    theme: "snow",
    modules: quillModules,
  });

  useEffect(() => {
    // Fetch the current post details for pre-filling
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
        setTitle(data.title);
        setImage(data.image);
        if (quill) {
          quill.root.innerHTML = data.content;
        }
      } catch (error) {
        toast.error(error.message || "Error fetching post");
      }
    };
    fetchPost();
  }, [postId, quill]);

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
    const updatedPost = { title, content, image };

    try {
      const response = await fetch(
        `http://localhost:5000/api/user/${userId}/update-post/${postId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedPost),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success("Post updated successfully!");
        navigate("/home");
      } else {
        toast.error(data.message || "Failed to update post.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while updating the post.");
    }
  };

  return (
    <div className="create-blog-container">
      <ToastContainer />
      <h2>Update Blog Post</h2>
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
          Update Post
        </button>
      </form>
    </div>
  );
}

export default UpdateBlogPost;
