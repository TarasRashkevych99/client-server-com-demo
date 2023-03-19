const path = require("path");
const localDb = require("../database/localDb");
const { generateToken, verifyCaptcha } = require("../services/auth.service");

function addRoutes(app) {
    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "../../content/content.html"));
    });

    app.post("/api/auth", async (req, res) => {
        const userName = req.body.userName;
        const password = req.body.password;
        const captcha = req.body["g-recaptcha-response"];
        try {
            await verifyCaptcha(captcha);

            const user = localDb.getUser(userName, password);
            if (user) {
                res.cookie("token-cookie", generateToken({ userId: user.id }), {
                    httpOnly: true,
                }).redirect("/");
            } else {
                res.status(401).send("Unauthorized");
            }
        } catch (error) {
            res.status(401).send("Unauthorized");
        }
    });
}

module.exports = addRoutes;