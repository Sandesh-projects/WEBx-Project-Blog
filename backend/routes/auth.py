from flask import Blueprint, request, jsonify
import bcrypt
from bson import ObjectId
from models import users_collection

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    phone = data.get("phone")
    education = data.get("education")
    occupation = data.get("occupation")
    profileImage = data.get("profileImage")
    
    if not name or not email or not password:
        return jsonify({"message": "Missing required fields: name, email, and password"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    user_doc = {
        "name": name,
        "email": email,
        "password": hashed_pw,
        "phone": phone,
        "education": education,
        "occupation": occupation,
        "profileImage": profileImage,
        "posts": []
    }
    users_collection.insert_one(user_doc)
    return jsonify({"message": "User registered successfully"}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"message": "Missing email or password"}), 400

    user = users_collection.find_one({"email": email})
    if not user:
        return jsonify({"message": "Invalid email or password"}), 401

    if bcrypt.hashpw(password.encode("utf-8"), user["password"]) == user["password"]:
        return jsonify({
            "message": "Login successful",
            "userId": str(user["_id"])
        }), 200
    else:
        return jsonify({"message": "Invalid email or password"}), 401
