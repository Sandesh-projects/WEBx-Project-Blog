import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Basic Info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Additional Info
  const [phone, setPhone] = useState("");
  const [education, setEducation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [profileImage, setProfileImage] = useState(""); // New field for profile image

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleNext = (e) => {
    e.preventDefault();
    // Validate step 1 fields
    if (!name || !email || !password) {
      setError("Please fill out all required fields.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleBack = (e) => {
    e.preventDefault();
    setStep(1);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result); // Convert to Base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const userData = {
      name,
      email,
      password,
      phone,
      education,
      occupation,
      profileImage,
    };

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="auth-container register-container">
      <h2>Register</h2>
      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}

      {step === 1 && (
        <form onSubmit={handleNext} className="register-form">
          <label>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Email Address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password *</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="next-btn">
            Next
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="register-form">
          <label>Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <label>Education</label>
          <input
            type="text"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
          />

          <label>Occupation</label>
          <input
            type="text"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
          />

          <label>Profile Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />

          <div className="button-group">
            <button onClick={handleBack} className="back-btn">
              Back
            </button>
            <button type="submit" className="submit-btn">
              Register
            </button>
          </div>
        </form>
      )}

      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;
