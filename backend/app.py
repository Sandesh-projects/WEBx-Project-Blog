from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import bcrypt
from bson import ObjectId
import random

load_dotenv()  # Load variables from .env

app = Flask(__name__)
CORS(app)

# MongoDB setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["blogdb"]  # Database name
users_collection = db["users"]  # Collection name

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"message": "Missing required fields"}), 400

    existing_user = users_collection.find_one({"email": email})
    if existing_user:
        return jsonify({"message": "User already exists"}), 400

    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    user_doc = {
        "name": name,
        "email": email,
        "password": hashed_pw,
        "posts": []  # Empty list for blog posts
    }
    users_collection.insert_one(user_doc)

    return jsonify({"message": "User registered successfully"}), 201

@app.route("/api/login", methods=["POST"])
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

@app.route("/api/posts", methods=["GET"])
def get_random_posts():
    users = list(users_collection.find({}, {"posts": 1}))  # Fetch only posts from all users
    all_posts = []
    
    for user in users:
        all_posts.extend(user.get("posts", []))  # Collect all posts

    random.shuffle(all_posts)  # Shuffle posts to get randomness
    max_posts = min(10, len(all_posts))  # Limit to 10 posts or available posts

    return jsonify(all_posts[:max_posts]), 200

@app.route("/api/user/<user_id>", methods=["GET"])
def get_user(user_id):
    try:
        user_object_id = ObjectId(user_id)
    except:
        return jsonify({"message": "Invalid user ID format"}), 400

    user = users_collection.find_one({"_id": user_object_id})
    if not user:
        return jsonify({"message": "User not found"}), 404

    return jsonify({
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "posts": user.get("posts", [])
    }), 200

@app.route("/api/user/<user_id>/create-post", methods=["POST"])
def create_post(user_id):
    try:
        user_object_id = ObjectId(user_id)
    except:
        return jsonify({"message": "Invalid user ID format"}), 400

    user = users_collection.find_one({"_id": user_object_id})
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    title = data.get("title")
    content = data.get("content")
    image = data.get("image")

    if not title or not content:
        return jsonify({"message": "Title and content are required"}), 400

    new_post = {
        "title": title,
        "content": content,
        "image": image,
    }

    users_collection.update_one(
        {"_id": user_object_id},
        {"$push": {"posts": new_post}}
    )

    return jsonify({"message": "Post created successfully"}), 201

if __name__ == "__main__":
    app.run(debug=True)
