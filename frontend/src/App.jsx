// App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import CreateBlogPost from "./pages/CreateBlogPost";
import BlogPage from "./pages/BlogPage";
import UpdateBlogPost from "./pages/UpdateBlogPost";

// PrivateRoute component to guard protected routes
function PrivateRoute({ children }) {
  const userId = localStorage.getItem("userId");
  return userId ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <div className="app-container">
      <Header />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/create-post"
          element={
            <PrivateRoute>
              <CreateBlogPost />
            </PrivateRoute>
          }
        />
        <Route
          path="/post/:postId"
          element={
            <PrivateRoute>
              <BlogPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/update-post/:postId"
          element={
            <PrivateRoute>
              <UpdateBlogPost />
            </PrivateRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
