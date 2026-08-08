const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const DATA_SERVICE_URL =
    process.env.DATA_SERVICE_URL || "http://data-service:5000";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("JWT_SECRET environment variable is required");
    process.exit(1);
}

/*
 * Health endpoint
 */
app.get("/health", (req, res) => {
    res.json({
        service: "auth-service",
        status: "healthy"
    });
});

/*
 * Authentication endpoint
 *
 * Auth Service delegates credential verification
 * to the Data Service.
 */
app.post("/login", async (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    try {

        const response = await axios.post(
            `${DATA_SERVICE_URL}/authenticate`,
            {
                username,
                password
            }
        );

        const user = response.data;

        const token = jwt.sign(
            {
                sub: user.id,
                username: user.username,
                role: user.role
            },
            JWT_SECRET,
            {
                expiresIn: "15m"
            }
        );

        return res.json({
            message: "Login successful",
            token
        });

    } catch (error) {

        if (error.response) {

            return res.status(error.response.status).json(
                error.response.data
            );
        }

        console.error("Data service error:", error.message);

        return res.status(503).json({
            message: "Authentication service unavailable"
        });
    }
});

/*
 * Example protected endpoint.
 *
 * This will later become a proper authorization
 * demonstration using JWT and role-based access.
 */
app.get("/data", async (req, res) => {

    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    const token = authorization.split(" ")[1];

    try {

        const decoded = jwt.verify(token, JWT_SECRET);

        return res.json({
            message: "Authenticated request",
            user: decoded,
            data: "Sensitive Data"
        });

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Auth Service running on port ${PORT}`);
});
