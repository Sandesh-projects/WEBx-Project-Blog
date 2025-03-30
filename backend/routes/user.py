from flask import Blueprint, jsonify
from bson import ObjectId
from models import users_collection

user_bp = Blueprint("user", __name__)

@user_bp.route("/user/<user_id>", methods=["GET"])
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
