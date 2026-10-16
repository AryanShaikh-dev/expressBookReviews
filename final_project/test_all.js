const axios = require('axios');
const { getAllBooks, getBookByISBN, getBooksByAuthor, getBooksByTitle } = require('./router/general');

const BASE_URL = 'http://localhost:5000';

async function runTests() {
    console.log('=== STARTING AUTOMATED ENDPOINT AND AXIOS TESTS ===\n');

    let passed = 0;
    let failed = 0;

    function assert(condition, testName, extraInfo = '') {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            passed++;
        } else {
            console.error(`[FAIL] ${testName} - ${extraInfo}`);
            failed++;
        }
    }

    try {
        // 1. Retrieve all books
        console.log('\n--- 1. Retrieve all books (GET /) ---');
        const allBooksRes = await axios.get(`${BASE_URL}/`);
        assert(allBooksRes.status === 200 && allBooksRes.data['1'].title === 'Things Fall Apart', 'Retrieve all books');

        // 2. Retrieve book by ISBN
        console.log('\n--- 2. Retrieve book by ISBN (GET /isbn/1) ---');
        const bookByIsbnRes = await axios.get(`${BASE_URL}/isbn/1`);
        assert(bookByIsbnRes.status === 200 && bookByIsbnRes.data.author === 'Chinua Achebe', 'Retrieve book by ISBN 1');

        // 3. Search books by author
        console.log('\n--- 3. Search books by author (GET /author/Jane Austen) ---');
        const authorRes = await axios.get(`${BASE_URL}/author/Jane Austen`);
        assert(authorRes.status === 200 && authorRes.data.booksbyauthor.length > 0 && authorRes.data.booksbyauthor[0].title === 'Pride and Prejudice', 'Search books by author Jane Austen');

        // 4. Search books by title
        console.log('\n--- 4. Search books by title (GET /title/Pride and Prejudice) ---');
        const titleRes = await axios.get(`${BASE_URL}/title/Pride and Prejudice`);
        assert(titleRes.status === 200 && titleRes.data.booksbytitle.length > 0 && titleRes.data.booksbytitle[0].author === 'Jane Austen', 'Search books by title Pride and Prejudice');

        // 5. Retrieve reviews for a specific book
        console.log('\n--- 5. Retrieve reviews for a specific book (GET /review/1) ---');
        const reviewRes = await axios.get(`${BASE_URL}/review/1`);
        assert(reviewRes.status === 200 && typeof reviewRes.data === 'object', 'Retrieve reviews for book 1');

        // 6. Register a new user
        console.log('\n--- 6. Register a new user (POST /register) ---');
        const testUser = `tester_${Date.now()}`;
        const testPass = 'Secret123!';
        const regRes = await axios.post(`${BASE_URL}/register`, {
            username: testUser,
            password: testPass
        });
        assert(regRes.status === 200 && regRes.data.message.includes('registered'), 'Register new user');

        // 7. Log in existing user
        console.log('\n--- 7. Log in existing user (POST /customer/login) ---');
        const loginRes = await axios.post(`${BASE_URL}/customer/login`, {
            username: testUser,
            password: testPass
        });
        const cookies = loginRes.headers['set-cookie'];
        const authHeader = loginRes.headers['authorization'];
        assert(loginRes.status === 200 && loginRes.data.includes('successfully logged in'), 'Log in existing user');

        const sessionCookie = cookies ? cookies[0].split(';')[0] : '';
        const clientWithAuth = axios.create({
            baseURL: BASE_URL,
            headers: {
                'Cookie': sessionCookie,
                ...(authHeader ? { 'Authorization': authHeader } : {})
            }
        });

        // 8. Add a review for a book
        console.log('\n--- 8. Add a review for a book (PUT /customer/auth/review/1) ---');
        const addReviewRes = await clientWithAuth.put('/customer/auth/review/1', {
            review: 'Magnificent masterpiece!'
        });
        assert(addReviewRes.status === 200 && addReviewRes.data.includes('added/updated'), 'Add review for book 1');

        // Verify review was added
        const checkReview1 = await axios.get(`${BASE_URL}/review/1`);
        assert(checkReview1.data[testUser] === 'Magnificent masterpiece!', 'Verify review exists on book 1');

        // 9. Update an existing review
        console.log('\n--- 9. Update existing review (PUT /customer/auth/review/1) ---');
        const updateReviewRes = await clientWithAuth.put('/customer/auth/review/1', {
            review: 'Updated: Absolute masterpiece of African literature!'
        });
        assert(updateReviewRes.status === 200 && updateReviewRes.data.includes('added/updated'), 'Update review for book 1');

        // Verify review was updated
        const checkReview2 = await axios.get(`${BASE_URL}/review/1`);
        assert(checkReview2.data[testUser] === 'Updated: Absolute masterpiece of African literature!', 'Verify review was updated on book 1');

        // 10. Delete a review
        console.log('\n--- 10. Delete a review (DELETE /customer/auth/review/1) ---');
        const deleteReviewRes = await clientWithAuth.delete('/customer/auth/review/1');
        assert(deleteReviewRes.status === 200 && deleteReviewRes.data.includes('deleted'), 'Delete review for book 1');

        // Verify review was deleted
        const checkReview3 = await axios.get(`${BASE_URL}/review/1`);
        assert(!checkReview3.data[testUser], 'Verify review was deleted from book 1');

        // 11. Tasks 10-13 Axios functions verification
        console.log('\n--- 11. Verify Axios Functions (Tasks 10 - 13) ---');
        const axiosAllBooks = await getAllBooks();
        assert(axiosAllBooks && axiosAllBooks['1'] !== undefined, 'Axios Task 10: getAllBooks()');

        const axiosBookByIsbn = await getBookByISBN('2');
        assert(axiosBookByIsbn && axiosBookByIsbn.title === 'Fairy tales', 'Axios Task 11: getBookByISBN("2")');

        const axiosBooksByAuthor = await getBooksByAuthor('Hans Christian Andersen');
        assert(axiosBooksByAuthor && axiosBooksByAuthor.booksbyauthor && axiosBooksByAuthor.booksbyauthor[0].title === 'Fairy tales', 'Axios Task 12: getBooksByAuthor("Hans Christian Andersen")');

        const axiosBooksByTitle = await getBooksByTitle('Fairy tales');
        assert(axiosBooksByTitle && axiosBooksByTitle.booksbytitle && axiosBooksByTitle.booksbytitle[0].author === 'Hans Christian Andersen', 'Axios Task 13: getBooksByTitle("Fairy tales")');

        console.log(`\n========================================`);
        console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
        console.log(`========================================\n`);

        if (failed > 0) {
            process.exit(1);
        }
    } catch (err) {
        console.error('Test execution failed with error:', err.response ? err.response.data : err.message);
        process.exit(1);
    }
}

runTests();
