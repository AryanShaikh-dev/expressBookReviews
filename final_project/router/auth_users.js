const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
    // Check if username is a valid non-empty string and not already registered
    if (!username || typeof username !== "string" || username.trim() === "") {
        return false;
    }
    const usersWithSameName = users.filter((user) => user.username === username);
    return usersWithSameName.length === 0;
};

const authenticatedUser = (username, password) => {
    // Check if username and password match any registered user record
    const validUsers = users.filter((user) => user.username === username && user.password === password);
    return validUsers.length > 0;
};

// Only registered users can login
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Error logging in: username and password required" });
    }

    if (authenticatedUser(username, password)) {
        // Generate JWT token
        const accessToken = jwt.sign(
            {
                data: password,
                username: username
            },
            'access',
            { expiresIn: 60 * 60 }
        );

        // Store session authorization details
        req.session.authorization = {
            accessToken,
            username
        };

        res.setHeader('Authorization', `Bearer ${accessToken}`);
        return res.status(200).send("Customer successfully logged in");
    } else {
        return res.status(208).json({ message: "Invalid Login. Check username and password" });
    }
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.query.review || (req.body && req.body.review);
    const username = req.session?.authorization?.username || req.user?.username;

    if (!username) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    if (!review) {
        return res.status(400).json({ message: "Review content is required" });
    }

    if (books[isbn]) {
        if (!books[isbn].reviews) {
            books[isbn].reviews = {};
        }
        books[isbn].reviews[username] = review;
        return res.status(200).send(`The review for the book with ISBN ${isbn} has been added/updated.`);
    } else {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    }
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session?.authorization?.username || req.user?.username;

    if (!username) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    if (books[isbn]) {
        if (books[isbn].reviews && books[isbn].reviews[username]) {
            delete books[isbn].reviews[username];
            return res.status(200).send(`Reviews for the ISBN ${isbn} posted by the user ${username} deleted.`);
        } else {
            return res.status(404).json({ message: `No review found for user ${username} on ISBN ${isbn}` });
        }
    } else {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.authenticatedUser = authenticatedUser;
module.exports.users = users;
