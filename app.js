const express = require('express');
const { initializeApp } = require('firebase/app');
const { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    sendPasswordResetEmail
} = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const bodyParser = require('body-parser');

const app = express();

// Firebase configuration
const firebaseConfig = {
    };

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// Set up EJS as the view engine
app.set('view engine', 'ejs');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/css', express.static('public/css'));

// Generate a 10-digit numeric code
const generateCode = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Routes
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    const { email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return res.render('signup', { error: 'Passwords do not match' });
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;
        const code = generateCode();

        await setDoc(doc(db, 'users', userId), {
            email: email,
            code: code
        });

        res.redirect('/dashboard');
    } catch (error) {
        res.render('signup', { error: error.message });
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        res.redirect('/dashboard');
    } catch (error) {
        res.render('login', { error: error.message });
    }
});

app.get('/dashboard', (req, res) => {
    const user = auth.currentUser;
    if (user) {
        res.render('dashboard', { user });
    } else {
        res.redirect('/login');
    }
});

app.get('/logout', async (req, res) => {
    try {
        await signOut(auth);
        res.redirect('/');
    } catch (error) {
        console.error('Error signing out:', error);
        res.redirect('/');
    }
});

app.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        await sendPasswordResetEmail(auth, email);
        res.render('forgot-password', { message: 'Password reset email sent. Check your inbox.' });
    } catch (error) {
        res.render('forgot-password', { error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`SyNEXUS server is running on port ${PORT}`);
});
