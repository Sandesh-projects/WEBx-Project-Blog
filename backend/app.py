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
db = client["blogdb"]
users_collection = db["users"]

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    # Basic required fields
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    # Additional fields from multi-step form
    phone = data.get("phone")
    education = data.get("education")
    occupation = data.get("occupation")
    profileImage = data.get("profileImage")  # Base64 string for profile image

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
        "profileImage": profileImage,  # May be None
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
            "userId": str(user["_id"]),
            "userName": user["name"]
        }), 200
    else:
        return jsonify({"message": "Invalid email or password"}), 401

@app.route("/api/posts", methods=["GET"])
def get_random_posts():
    users = list(users_collection.find({}, {"posts": 1}))
    all_posts = []
    for user in users:
        all_posts.extend(user.get("posts", []))
    random.shuffle(all_posts)
    max_posts = min(10, len(all_posts))
    return jsonify(all_posts[:max_posts]), 200

@app.route("/api/search", methods=["GET"])
def search_posts():
    title_query = request.args.get("title", "")
    if not title_query:
        return get_random_posts()
    users = list(users_collection.find({}, {"posts": 1}))
    matching_posts = []
    for user in users:
        for post in user.get("posts", []):
            if title_query.lower() in post.get("title", "").lower():
                matching_posts.append(post)
    random.shuffle(matching_posts)
    max_posts = min(10, len(matching_posts))
    return jsonify(matching_posts[:max_posts]), 200

@app.route("/api/post/<post_id>", methods=["GET"])
def get_single_post(post_id):
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
        "phone": user.get("phone"),
        "education": user.get("education"),
        "occupation": user.get("occupation"),
        "profileImage": user.get("profileImage"),
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
    content = data.get("content")  # Full HTML content
    image = data.get("image")

    if not title or not content:
        return jsonify({"message": "Title and content are required"}), 400

    new_post = {
        "postId": str(ObjectId()),
        "title": title,
        "content": content,  # Store full HTML content
        "image": image,
        "timestamp": datetime.utcnow().isoformat(),
        "author": user["name"],
        "likes": 0,
        "dislikes": 0,
        "likedBy": [],
        "dislikedBy": [],
        "comments": []
    }

    users_collection.update_one(
        {"_id": user_object_id},
        {"$push": {"posts": new_post}}
    )

    return jsonify({"message": "Post created successfully", "postId": new_post["postId"]}), 201
# Updated add-comment endpoint that uses userId to auto-fetch username
@app.route("/api/post/<post_id>/add-comment", methods=["POST"])
def add_comment(post_id):
    data = request.get_json()
    userId = data.get("userId")
    comment_content = data.get("content")
    if not userId or not comment_content:
        return jsonify({"message": "Missing user ID or comment content"}), 400
    try:
        user_object_id = ObjectId(userId)
    except Exception:
        return jsonify({"message": "Invalid user ID"}), 400
    user = users_collection.find_one({"_id": user_object_id})
    if not user:
        return jsonify({"message": "User not found"}), 404
    commenter = user.get("name")
    new_comment = {
        "commentId": str(ObjectId()),
        "commenter": commenter,
        "content": comment_content,
        "timestamp": datetime.utcnow().isoformat(),
        "replies": []
    }
    result = users_collection.update_one(
        {"posts.postId": post_id},
        {"$push": {"posts.$.comments": new_comment}}
    )
    if result.modified_count > 0:
        return jsonify({"message": "Comment added successfully", "comment": new_comment}), 201
    else:
        return jsonify({"message": "Failed to add comment"}), 400

# Updated add-reply endpoint that uses userId to auto-fetch username
@app.route("/api/post/<post_id>/add-reply", methods=["POST"])
def add_reply(post_id):
    data = request.get_json()
    userId = data.get("userId")
    comment_id = data.get("commentId")
    replyContent = data.get("replyContent")
    if not userId or not comment_id or not replyContent:
        return jsonify({"message": "Missing required fields: user ID, comment ID, or reply content"}), 400
    try:
        user_object_id = ObjectId(userId)
    except Exception:
        return jsonify({"message": "Invalid user ID"}), 400
    user = users_collection.find_one({"_id": user_object_id})
    if not user:
        return jsonify({"message": "User not found"}), 404
    replyCommenter = user.get("name")
    new_reply = {
        "replyId": str(ObjectId()),
        "replyCommenter": replyCommenter,
        "replyContent": replyContent,
        "timestamp": datetime.utcnow().isoformat()
    }
    result = users_collection.update_one(
        {"posts.postId": post_id},
        {"$push": {"posts.$[post].comments.$[comment].replies": new_reply}},
        array_filters=[{"post.postId": post_id}, {"comment.commentId": comment_id}]
    )
    if result.modified_count > 0:
        return jsonify({"message": "Reply added successfully", "reply": new_reply}), 201
    else:
        return jsonify({"message": "Failed to add reply"}), 400

# Toggle Like endpoint (as before)
@app.route("/api/post/<post_id>/toggle-like", methods=["POST"])
def toggle_like(post_id):
    data = request.get_json()
    userId = data.get("userId")
    if not userId:
        return jsonify({"message": "Missing user ID"}), 400
    user_doc = users_collection.find_one({"posts.postId": post_id})
    if not user_doc:
        return jsonify({"message": "Post not found"}), 404
    target_post = None
    for post in user_doc.get("posts", []):
        if post.get("postId") == post_id:
            target_post = post
            break
    if not target_post:
        return jsonify({"message": "Post not found"}), 404
    if userId in target_post.get("likedBy", []):
        result = users_collection.update_one(
            {"posts.postId": post_id},
            {
                "$inc": {"posts.$.likes": -1},
                "$pull": {"posts.$.likedBy": userId}
            }
        )
        if result.modified_count > 0:
            return jsonify({"message": "Like removed"}), 200
        else:
            return jsonify({"message": "Failed to remove like"}), 400
    else:
        update_ops = {
            "$inc": {"posts.$.likes": 1},
            "$push": {"posts.$.likedBy": userId}
        }
        if userId in target_post.get("dislikedBy", []):
            update_ops["$inc"]["posts.$.dislikes"] = -1
            update_ops["$pull"] = {"posts.$.dislikedBy": userId}
        result = users_collection.update_one(
            {"posts.postId": post_id},
            update_ops
        )
        if result.modified_count > 0:
            return jsonify({"message": "Post liked"}), 200
        else:
            return jsonify({"message": "Failed to like post"}), 400

# Toggle Dislike endpoint (as before)
@app.route("/api/post/<post_id>/toggle-dislike", methods=["POST"])
def toggle_dislike(post_id):
    data = request.get_json()
    userId = data.get("userId")
    if not userId:
        return jsonify({"message": "Missing user ID"}), 400
    user_doc = users_collection.find_one({"posts.postId": post_id})
    if not user_doc:
        return jsonify({"message": "Post not found"}), 404
    target_post = None
    for post in user_doc.get("posts", []):
        if post.get("postId") == post_id:
            target_post = post
            break
    if not target_post:
        return jsonify({"message": "Post not found"}), 404
    if userId in target_post.get("dislikedBy", []):
        result = users_collection.update_one(
            {"posts.postId": post_id},
            {
                "$inc": {"posts.$.dislikes": -1},
                "$pull": {"posts.$.dislikedBy": userId}
            }
        )
        if result.modified_count > 0:
            return jsonify({"message": "Dislike removed"}), 200
        else:
            return jsonify({"message": "Failed to remove dislike"}), 400
    else:
        update_ops = {
            "$inc": {"posts.$.dislikes": 1},
            "$push": {"posts.$.dislikedBy": userId}
        }
        if userId in target_post.get("likedBy", []):
            update_ops["$inc"]["posts.$.likes"] = -1
            update_ops["$pull"] = {"posts.$.likedBy": userId}
        result = users_collection.update_one(
            {"posts.postId": post_id},
            update_ops
        )
        if result.modified_count > 0:
            return jsonify({"message": "Post disliked"}), 200
        else:
            return jsonify({"message": "Failed to dislike post"}), 400

@app.route("/api/user/<user_id>/delete-post/<post_id>", methods=["DELETE"])
def delete_post(user_id, post_id):
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        return jsonify({"message": "Invalid user ID format"}), 400
    result = users_collection.update_one(
        {"_id": user_object_id},
        {"$pull": {"posts": {"postId": post_id}}}
    )
    if result.modified_count > 0:
        return jsonify({"message": "Post deleted successfully"}), 200
    else:
        return jsonify({"message": "Failed to delete post"}), 400
    
# New endpoint: Increment view count only if user hasn't viewed before
@app.route("/api/post/<post_id>/add-view", methods=["POST"])
def add_view(post_id):
    data = request.get_json()
    userId = data.get("userId")
    if not userId:
        return jsonify({"message": "Missing user ID"}), 400
    user_doc = users_collection.find_one({"posts.postId": post_id})
    if not user_doc:
        return jsonify({"message": "Post not found"}), 404
    target_post = None
    for post in user_doc.get("posts", []):
        if post.get("postId") == post_id:
            target_post = post
            break
    if not target_post:
        return jsonify({"message": "Post not found"}), 404
    if userId in target_post.get("viewedBy", []):
        return jsonify({"message": "View already counted", "views": target_post.get("views", 0)}), 200
    result = users_collection.update_one(
        {"posts.postId": post_id},
        {"$inc": {"posts.$.views": 1}, "$push": {"posts.$.viewedBy": userId}}
    )
    if result.modified_count > 0:
        return jsonify({"message": "View added"}), 200
    else:
        return jsonify({"message": "Failed to add view"}), 400

if __name__ == "__main__":
    app.run(debug=True)
