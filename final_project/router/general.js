const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// Simulates an asynchronous data source for the books database
const getBooks = () => new Promise((resolve) => resolve(books));

const filterBooks = async (field, value) => {
  const allBooks = await getBooks();
  const target = value.toLowerCase();
  const result = {};
  Object.keys(allBooks).forEach((isbn) => {
    if (allBooks[isbn][field].toLowerCase() === target) {
      result[isbn] = allBooks[isbn];
    }
  });
  return result;
};

public_users.post("/register", (req,res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  }
  if (!isValid(username)) {
    return res.status(409).json({message: "User already exists!"});
  }

  users.push({ username, password });
  return res.status(201).json({message: "User successfully registered. Now you can login"});
});

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  try {
    const allBooks = await getBooks();
    return res.status(200).send(JSON.stringify(allBooks, null, 4));
  } catch (err) {
    return res.status(500).json({message: "Error retrieving books"});
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  try {
    const allBooks = await getBooks();
    const book = allBooks[req.params.isbn];
    if (!book) {
      return res.status(404).json({message: `Book with ISBN ${req.params.isbn} not found`});
    }
    return res.status(200).send(JSON.stringify(book, null, 4));
  } catch (err) {
    return res.status(500).json({message: "Error retrieving book"});
  }
 });

// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  try {
    const result = await filterBooks("author", req.params.author);
    if (Object.keys(result).length === 0) {
      return res.status(404).json({message: `No books found by author ${req.params.author}`});
    }
    return res.status(200).send(JSON.stringify(result, null, 4));
  } catch (err) {
    return res.status(500).json({message: "Error retrieving books"});
  }
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  try {
    const result = await filterBooks("title", req.params.title);
    if (Object.keys(result).length === 0) {
      return res.status(404).json({message: `No books found with title ${req.params.title}`});
    }
    return res.status(200).send(JSON.stringify(result, null, 4));
  } catch (err) {
    return res.status(500).json({message: "Error retrieving books"});
  }
});

//  Get book review
public_users.get('/review/:isbn', async function (req, res) {
  try {
    const allBooks = await getBooks();
    const book = allBooks[req.params.isbn];
    if (!book) {
      return res.status(404).json({message: `Book with ISBN ${req.params.isbn} not found`});
    }
    return res.status(200).send(JSON.stringify(book.reviews, null, 4));
  } catch (err) {
    return res.status(500).json({message: "Error retrieving reviews"});
  }
});

// ---------------------------------------------------------------------------
// Tasks 10-13: retrieve books using Axios with async/await and Promise callbacks
// ---------------------------------------------------------------------------

// Task 10: Get the list of all books using async/await with Axios
const fetchAllBooks = async () => {
  const response = await axios.get(`${BASE_URL}/`);
  return response.data;
};

// Task 11: Get book details based on ISBN using Promise callbacks with Axios
const fetchBookByISBN = (isbn) => {
  return axios.get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`)
    .then((response) => response.data)
    .catch((err) => { throw new Error(`Error fetching book with ISBN ${isbn}: ${err.message}`); });
};

// Task 12: Get book details based on author using async/await with Axios
const fetchBooksByAuthor = async (author) => {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (err) {
    throw new Error(`Error fetching books by author ${author}: ${err.message}`);
  }
};

// Task 13: Get book details based on title using async/await with Axios
const fetchBooksByTitle = async (title) => {
  try {
    const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
    return response.data;
  } catch (err) {
    throw new Error(`Error fetching books with title ${title}: ${err.message}`);
  }
};

// Task 10 route: all books via Axios (async/await)
public_users.get('/async/books', async function (req, res) {
  try {
    const data = await fetchAllBooks();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({message: "Error retrieving books", error: err.message});
  }
});

// Task 11 route: book by ISBN via Axios (Promise callbacks)
public_users.get('/async/isbn/:isbn', function (req, res) {
  fetchBookByISBN(req.params.isbn)
    .then((data) => res.status(200).json(data))
    .catch((err) => res.status(404).json({message: err.message}));
});

// Task 12 route: books by author via Axios (async/await)
public_users.get('/async/author/:author', async function (req, res) {
  try {
    const data = await fetchBooksByAuthor(req.params.author);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(404).json({message: err.message});
  }
});

// Task 13 route: books by title via Axios (async/await)
public_users.get('/async/title/:title', async function (req, res) {
  try {
    const data = await fetchBooksByTitle(req.params.title);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(404).json({message: err.message});
  }
});

module.exports.general = public_users;
module.exports.fetchAllBooks = fetchAllBooks;
module.exports.fetchBookByISBN = fetchBookByISBN;
module.exports.fetchBooksByAuthor = fetchBooksByAuthor;
module.exports.fetchBooksByTitle = fetchBooksByTitle;
