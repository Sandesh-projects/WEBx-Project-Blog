// App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile"; // import the new Profile page
import CreateBlogPost from "./pages/CreateBlogPost";
import BlogPage from "./pages/BlogPage";

function App() {
  return (
    <div className="app-container">
      <Header />

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create-post" element={<CreateBlogPost />} />
        <Route path="/post/:postId" element={<BlogPage />} />
        {/* Add more routes if needed */}
      </Routes>

      <Footer />
    </div>
  );
}

export default App;
