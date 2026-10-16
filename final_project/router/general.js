const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = 'http://localhost:5000';

// Register a new customer (Task 6)
public_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    if (!isValid(username)) {
        return res.status(409).json({ message: "Customer already exists or invalid username." });
    }

    users.push({ username, password });
    return res.status(200).json({ message: "Customer successfully registered. Now you can login" });
});

// Get the book list available in the shop using Promise (Task 1 & Task 10)
public_users.get('/', function (req, res) {
    const getBooks = new Promise((resolve, reject) => {
        if (books) {
            resolve(books);
        } else {
            reject({ status: 500, message: "Unable to retrieve book list" });
        }
    });

    getBooks
        .then((bookList) => res.status(200).send(JSON.stringify(bookList, null, 4)))
        .catch((err) => res.status(err.status || 500).json({ message: err.message }));
});

// Get book details based on ISBN using Promise (Task 2 & Task 11)
public_users.get('/isbn/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    const getBook = new Promise((resolve, reject) => {
        if (books[isbn]) {
            resolve(books[isbn]);
        } else {
            reject({ status: 404, message: `Book with ISBN ${isbn} not found` });
        }
    });

    getBook
        .then((book) => res.status(200).send(JSON.stringify(book, null, 4)))
        .catch((err) => res.status(err.status || 500).json({ message: err.message }));
});
  
// Get book details based on author using Promise (Task 3 & Task 12)
public_users.get('/author/:author', function (req, res) {
    const author = req.params.author;
    const getBooksByAuthor = new Promise((resolve, reject) => {
        const filteredBooks = [];
        const keys = Object.keys(books);
        keys.forEach((key) => {
            if (books[key].author.toLowerCase() === author.toLowerCase()) {
                filteredBooks.push({
                    isbn: key,
                    title: books[key].title,
                    reviews: books[key].reviews
                });
            }
        });

        if (filteredBooks.length > 0) {
            resolve(filteredBooks);
        } else {
            reject({ status: 404, message: `No books found for author: ${author}` });
        }
    });

    getBooksByAuthor
        .then((matched) => res.status(200).send(JSON.stringify({ booksbyauthor: matched }, null, 4)))
        .catch((err) => res.status(err.status || 500).json({ message: err.message }));
});

// Get all books based on title using Promise (Task 4 & Task 13)
public_users.get('/title/:title', function (req, res) {
    const title = req.params.title;
    const getBooksByTitle = new Promise((resolve, reject) => {
        const filteredBooks = [];
        const keys = Object.keys(books);
        keys.forEach((key) => {
            if (books[key].title.toLowerCase() === title.toLowerCase()) {
                filteredBooks.push({
                    isbn: key,
                    author: books[key].author,
                    reviews: books[key].reviews
                });
            }
        });

        if (filteredBooks.length > 0) {
            resolve(filteredBooks);
        } else {
            reject({ status: 404, message: `No books found with title: ${title}` });
        }
    });

    getBooksByTitle
        .then((matched) => res.status(200).send(JSON.stringify({ booksbytitle: matched }, null, 4)))
        .catch((err) => res.status(err.status || 500).json({ message: err.message }));
});

// Get book review based on ISBN (Task 5)
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    if (books[isbn]) {
        return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
    } else {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    }
});

// ==========================================
// Axios-based Functions for Tasks 10 - 13
// ==========================================

// Task 10: Get all books using async/await with Axios
const getAllBooks = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Task 11: Search by ISBN using Promises with Axios
const getBookByISBN = (isbn) => {
    return new Promise((resolve, reject) => {
        axios.get(`${BASE_URL}/isbn/${isbn}`)
            .then((response) => resolve(response.data))
            .catch((error) => reject(error));
    });
};

// Task 12: Search by Author using async/await with Axios
const getBooksByAuthor = async (author) => {
    try {
        const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Task 13: Search by Title using async/await with Axios
const getBooksByTitle = async (title) => {
    try {
        const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
