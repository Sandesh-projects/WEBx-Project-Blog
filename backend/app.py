from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import bcrypt
from bson import ObjectId
import random
from datetime import datetime  # For timestamps

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
    # Fetch only the posts fields from all users
    users = list(users_collection.find({}, {"posts": 1}))
    all_posts = []
    for user in users:
        all_posts.extend(user.get("posts", []))
    
    random.shuffle(all_posts)
    max_posts = min(10, len(all_posts))
    return jsonify(all_posts[:max_posts]), 200

@app.route("/api/post/<post_id>", methods=["GET"])
def get_single_post(post_id):
    """
    Find the user document that contains a post with the given postId.
    """
    user = users_collection.find_one({"posts.postId": post_id})
    if not user:
        return jsonify({"message": "Post not found"}), 404

    for post in user.get("posts", []):
        if post.get("postId") == post_id:
            return jsonify(post), 200
    return jsonify({"message": "Post not found"}), 404

@app.route("/api/user/<user_id>", methods=["GET"])
def get_user(user_id):
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
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
    except Exception:
        return jsonify({"message": "Invalid user ID format"}), 400

    user = users_collection.find_one({"_id": user_object_id})
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json()
    title = data.get("title")
    content = data.get("content")
    image = data.get("image")  # Base64-encoded string

    if not title or not content:
        return jsonify({"message": "Title and content are required"}), 400

    new_post = {
        "postId": str(ObjectId()),  # Unique ID for this post
        "title": title,
        "content": content,
        "image": image,
        "timestamp": datetime.utcnow().isoformat(),
        "comments": []  # Initialize empty comments array
    }

    users_collection.update_one(
        {"_id": user_object_id},
        {"$push": {"posts": new_post}}
    )
    return jsonify({"message": "Post created successfully", "postId": new_post["postId"]}), 201

@app.route("/api/post/<post_id>/add-comment", methods=["POST"])
def add_comment(post_id):
    # Find the user document that contains the post
    user = users_collection.find_one({"posts.postId": post_id})
    if not user:
        return jsonify({"message": "Post not found"}), 404

    data = request.get_json()
    commenter = data.get("commenter")
    comment_content = data.get("content")

    if not commenter or not comment_content:
        return jsonify({"message": "Commenter and comment content are required"}), 400

    new_comment = {
        "commentId": str(ObjectId()),
        "commenter": commenter,
        "content": comment_content,
        "timestamp": datetime.utcnow().isoformat(),
        "replies": []  # Initialize empty replies array
    }

    result = users_collection.update_one(
        {"posts.postId": post_id},
        {"$push": {"posts.$.comments": new_comment}}
    )
    if result.modified_count > 0:
        return jsonify({"message": "Comment added successfully", "comment": new_comment}), 201
    else:
        return jsonify({"message": "Failed to add comment"}), 400

@app.route("/api/post/<post_id>/add-reply", methods=["POST"])
def add_reply(post_id):
    # Find the user document that contains the post
    user = users_collection.find_one({"posts.postId": post_id})
    if not user:
        return jsonify({"message": "Post not found"}), 404

    data = request.get_json()
    comment_id = data.get("commentId")
    replyCommenter = data.get("replyCommenter")
    replyContent = data.get("replyContent")

    if not comment_id or not replyCommenter or not replyContent:
        return jsonify({"message": "Comment ID, reply commenter, and reply content are required"}), 400

    new_reply = {
        "replyId": str(ObjectId()),
        "replyCommenter": replyCommenter,
        "replyContent": replyContent,
        "timestamp": datetime.utcnow().isoformat()
    }

    # Use arrayFilters to update the correct comment's replies array
    result = users_collection.update_one(
        {"posts.postId": post_id},
        {"$push": {"posts.$[post].comments.$[comment].replies": new_reply}},
        array_filters=[{"post.postId": post_id}, {"comment.commentId": comment_id}]
    )
    if result.modified_count > 0:
        return jsonify({"message": "Reply added successfully", "reply": new_reply}), 201
    else:
        return jsonify({"message": "Failed to add reply"}), 400

if __name__ == "__main__":
    app.run(debug=True)
