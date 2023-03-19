require("dotenv").config();

const path = require("path");
const bodyParser = require("body-parser");
const localDb = require("./db/localDb");
const cookieParser = require("cookie-parser");
const {
    generateToken,
    verifyToken,
    verifyCaptcha,
} = require("./services/auth.service");

let app = require("./app");

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

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../content/content.html"));
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

app.start();
