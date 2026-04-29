from flask import Flask, request, jsonify

app = Flask(__name__)
SECRET_KEY = "my-super-secret-key"

@app.route("/data", methods=["GET"])
def get_data():
    auth = request.headers.get("Authorization")

    if auth == SECRET_KEY:
        return jsonify({"data": "Sensitive Data from Python Service"})
    else:
        return jsonify({"message": "Forbidden"}), 403

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
