require("dotenv").config();

const express = require("express");
const https = require("https");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const bodyParser = require("body-parser");
const localDb = require("./db/localDb");
const cookieParser = require("cookie-parser");
const { generateToken, verifyToken } = require("./services/auth.service");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
    if (process.env.HTTPS === "true" && !req.client.authorized) {
        return res
            .status(401)
            .send("Invalid client certificate authentication.");
    }
    return next();
});

app.use(/\/((?!api\/auth).)*/, (req, res, next) => {
    const token = req.cookies["token-cookie"];
    if (token) {
        try {
            const payload = verifyToken(token);
            req.userId = payload.userId;
            next();
        } catch (error) {
            res.clearCookie("token-cookie");
            res.status(401).send("Unauthorized");
        }
    } else {
        res.sendFile(path.join(__dirname, "../public/index.html"));
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../content/content.html"));
});

app.post("/api/auth", (req, res) => {
    const userName = req.body.userName;
    const password = req.body.password;
    if (userName && password) {
        const user = localDb.users.find(
            (user) => user.userName === userName && user.password === password
        );
        if (user) {
            res.cookie("token-cookie", generateToken({ userId: user.id }), {
                httpOnly: true,
            });
            res.redirect("/");
        } else {
            res.status(401).send("Unauthorized");
        }
    }
});

let server = app;

if (process.env.HTTPS === "true") {
    const options = {
        key: fs.readFileSync(path.join(__dirname, "../cert/server/key.pem")),
        cert: fs.readFileSync(path.join(__dirname, "../cert/server/cert.pem")),
        requestCert: true,
        rejectUnauthorized: false,
        ca: [fs.readFileSync(path.join(__dirname, "../cert/server/cert.pem"))],
    };

    server = https.createServer(options, app);
}

const port = 3000 || process.env.PORT;

server.listen(port, () => {
    console.log(`Secure Server is listening on port ${port}`);
});
