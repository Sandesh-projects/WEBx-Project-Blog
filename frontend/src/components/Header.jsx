// Header.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";

function Header() {
  const navigate = useNavigate();

  // A simple check for a "token" in localStorage
  const isLoggedIn = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <header>
      <nav>
        <Link to="/home">BlogMingle</Link>
        <ul>
          {isLoggedIn ? (
            <>
              {/* Profile Icon Link */}
              <li>
                <Link to="/profile" className="profile-icon">
                  {/* Replace with your own icon or an <img> tag */}
                  <span>Profile</span>
                </Link>
              </li>
              {/* Logout Button */}
              <li>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
