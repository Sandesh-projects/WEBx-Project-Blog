from flask import Blueprint, request, jsonify
import random
from datetime import datetime
from bson import ObjectId
from models import users_collection

posts_bp = Blueprint("posts", __name__)

@posts_bp.route("/posts", methods=["GET"])
def get_random_posts():
    users = list(users_collection.find({}, {"posts": 1}))
    all_posts = []
    for user in users:
        all_posts.extend(user.get("posts", []))
    random.shuffle(all_posts)
    max_posts = min(10, len(all_posts))
    return jsonify(all_posts[:max_posts]), 200

@posts_bp.route("/search", methods=["GET"])
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

@posts_bp.route("/post/<post_id>", methods=["GET"])
def get_single_post(post_id):
    user = users_collection.find_one({"posts.postId": post_id})
    if not user:
        return jsonify({"message": "Post not found"}), 404

    for post in user.get("posts", []):
        if post.get("postId") == post_id:
            return jsonify(post), 200
    return jsonify({"message": "Post not found"}), 404

@posts_bp.route("/user/<user_id>/create-post", methods=["POST"])
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
    image = data.get("image")

    if not title or not content:
        return jsonify({"message": "Title and content are required"}), 400

    new_post = {
        "postId": str(ObjectId()),
        "title": title,
        "content": content,
        "image": image,
        "timestamp": datetime.utcnow().isoformat(),
        "author": user["name"],
        "comments": []
    }

    users_collection.update_one(
        {"_id": user_object_id},
        {"$push": {"posts": new_post}}
    )
    return jsonify({"message": "Post created successfully", "postId": new_post["postId"]}), 201

@posts_bp.route("/post/<post_id>/add-comment", methods=["POST"])
def add_comment(post_id):
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

@posts_bp.route("/post/<post_id>/add-reply", methods=["POST"])
def add_reply(post_id):
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

    result = users_collection.update_one(
        {"posts.postId": post_id},
        {"$push": {"posts.$[post].comments.$[comment].replies": new_reply}},
        array_filters=[{"post.postId": post_id}, {"comment.commentId": comment_id}]
    )
    if result.modified_count > 0:
        return jsonify({"message": "Reply added successfully", "reply": new_reply}), 201
    else:
        return jsonify({"message": "Failed to add reply"}), 400

@posts_bp.route("/api/user/<user_id>/delete-post/<post_id>", methods=["DELETE"])
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
