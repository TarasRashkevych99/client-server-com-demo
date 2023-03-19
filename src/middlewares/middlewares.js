const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { verifyToken } = require("../services/auth.service");

function addMiddlewares(app) {
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
    app.use("/api/auth", (req, res, next) => {
        const userName = req.body.userName;
        const password = req.body.password;
        const captcha = req.body["g-recaptcha-response"];
        if (!userName || !password || !captcha) {
            res.status(401).send("Unauthorized");
        }
        next();
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
}

module.exports = addMiddlewares;
