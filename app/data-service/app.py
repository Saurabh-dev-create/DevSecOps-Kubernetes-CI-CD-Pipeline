from flask import Flask, jsonify, request
import psycopg2
import os

app = Flask(__name__)

DB_HOST = os.getenv("DB_HOST", "postgres")
DB_NAME = os.getenv("DB_NAME", "devsecops")
DB_USER = os.getenv("DB_USER", "admin")
DB_PASSWORD = os.getenv("DB_PASSWORD")


def get_connection():
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )


@app.route("/health")
def health():
    return jsonify({
        "service": "data-service",
        "status": "healthy"
    })


@app.route("/users")
def users():

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, username, role
        FROM users
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify([
        {
            "id": row[0],
            "username": row[1],
            "role": row[2]
        }
        for row in rows
    ])


@app.route("/authenticate", methods=["POST"])
def authenticate():

    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({
            "message": "Username and password are required"
        }), 400

    conn = get_connection()
    cur = conn.cursor()

    # NOTE:
    # This intentionally uses string interpolation.
    # It will be used later as a controlled SQL injection
    # demonstration for the DevSecOps security pipeline.
    query = (
        "SELECT id, username, role "
        "FROM users "
        f"WHERE username = '{username}' "
        f"AND password = '{password}'"
    )

    cur.execute(query)
    user = cur.fetchone()

    cur.close()
    conn.close()

    if not user:
        return jsonify({
            "message": "Invalid credentials"
        }), 401

    return jsonify({
        "id": user[0],
        "username": user[1],
        "role": user[2]
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
