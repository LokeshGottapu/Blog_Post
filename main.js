require("dotenv").config();

const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");

const corsOptions = {
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.static("public"));
app.use(
    session({
        secret: "secret",
        resave: false, // Do not save session if it hasn’t been modified
        saveUninitialized: true,
    })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new GoogleStrategy(
        {
            clientID: "1014183577046-f6073o0d3kv0136064o5bklf57asm8k0.apps.googleusercontent.com",
            clientSecret: "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",
            callbackURL: "http://localhost:3000/auth/google/callback",
        },
        (accessToken, refreshToken, profile, done) => {
            // console.log("Google Profile Data:", profile._json); // Logs the profile data
            return done(null, profile);
        }
    )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));


// Function to check whether user is logged in 
function isLoggedIn(req, res, next) {
    req.user ? next() : res.sendStatus(401);
}

// API to display the home page 
app.get("/", (req, res) => {

    if (req.isAuthenticated()) {
        // User is logged in; serve the app/home page
        res.sendFile(__dirname + "/views/index.html");
    } else {
        // User is not logged in; serve the login page
        res.sendFile(__dirname + "/views/login.html");
    }

});


// API to login 
app.post("/login", (req, res) => {
    res.redirect(`/auth/google`);
});

// API for google auth 
app.get(
    "/auth/google",
    (req, res, next) => {
        const action = req.query.action;

        passport.authenticate("google", {
            scope: ["profile", "email"],
            // prompt: "select_account"
        })(req, res, next);
    }
);

// API for google auth callback
app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {

        // Store Google profile in session
        let googleUser = req.user;

        if (!googleUser) {
            console.error("No user found in session during /addUser");
            return res.status(400).json({ error: "No user found in session." });
        }

        let { email, name } = googleUser._json;

        // res.render("profile", { name });
        res.redirect("/");

    }

);

const posts = [];


app.get("/blogs", async (req, res) => {

    let { page, limit } = req.query;

    // Convert page & limit to numbers and set defaults
    page = parseInt(page) || 1;  // Default page = 1
    limit = parseInt(limit) || 5; // Default limit = 5

    // Calculate start and end index
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Paginate posts
    const paginatedPosts = posts.slice(startIndex, endIndex);
    console.log(paginatedPosts);

    // Response with pagination details
    res.status(200).json({
        totalPosts: posts.length,
        totalPages: Math.ceil(posts.length / limit),
        currentPage: page,
        pageSize: limit,
        posts: paginatedPosts
    });
    
});

app.post("/blog", async (req, res) => {

    let { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({
            message: "No input"
        });
    }

    let addPost = { postId: posts.length + 1, title, content };
    posts.push(addPost);

    res.status(201).json(addPost);

});

app.get("/blog/:postId", async (req, res) => {

    let postId = parseInt(req.params.postId);

    // const postIndex = posts.findIndex(post => post.postId === postId);
    const post = posts.find(post => post.postId === postId);

    if (!post) {
        return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post); // Return the post if found

});

app.put("/blog/:postId", async (req, res) => {

    let postId = parseInt(req.params.postId);
    let { title, content } = req.body;

    // Validate input
    if (!title || !content) {
        return res.status(400).json({ message: "Title and content cannot be empty." });
    }

    const postIndex = posts.findIndex(post => post.postId === postId);

    if (postIndex === -1) {
        return res.status(404).json({ message: "Post not found" });
    }

    // Update the post
    posts[postIndex].title = title;
    posts[postIndex].content = content;

    res.status(200).json({ message: "Post updated successfully", updatedPost: posts[postIndex] });

});

app.delete("/blog/:postId", async (req, res) => {

    let { postId } = req.params;
    postId = parseInt(postId);

    // Find the index of the post with the given ID
    const postIndex = posts.findIndex(post => post.postId === postId);

    if (postIndex === -1) {
        return res.status(404).json({ message: "Post not found" });
    }

    // Remove the post from the array
    let deletedPost = posts.splice(postIndex, 1)[0];

    console.log("Deleted Post:", deletedPost);
    res.status(200).json({ message: "Post deleted successfully", deletedPost });

});


app.get("/logout", (req, res, next) => {

    req.logout((err) => {
        if (err) {
            console.error("Error logging out:", err);
            return next(err);
        }

        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
                return next(err);
            }

            // Clear cookies explicitly
            res.clearCookie("connect.sid", { path: "/" });

            // console.log("Session destroyed, cookies cleared, user logged out.");
            // res.status(200).json({ message: "Logout successful" });

            // ✅ Only use res.redirect("/")
            res.redirect("/");
        });
    });
});





app.listen(3000, () => {
    console.log(`Server is running at port 3000.`);
});