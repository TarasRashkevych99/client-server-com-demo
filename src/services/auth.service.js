const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const axios = require("axios");

function generateToken(payload) {
    const privateKey = fs.readFileSync(
        path.join(__dirname, "../../token/private.pem")
    );
    const token = jwt.sign(payload, privateKey, {
        algorithm: "ES256",
        expiresIn: process.env.TOKEN_EXPIRES_IN,
    });
    return token;
}

function verifyToken(token) {
    const publicKey = fs.readFileSync(
        path.join(__dirname, "../../token/public.pem")
    );
    try {
        const payload = jwt.verify(token, publicKey, {
            algorithms: ["ES256"],
        });
        return payload;
    } catch (error) {
        throw new Error("Invalid token");
    }
}

function verifyCaptcha(captcha) {
    const secretKey = process.env.CAPTCHA_SECRET_KEY;
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}`;
    return axios.post(verificationUrl);
}

module.exports = {
    generateToken,
    verifyToken,
    verifyCaptcha,
};
