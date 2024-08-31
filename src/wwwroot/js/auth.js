// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyDFzfBDWVd-H6dIADQUmmxiRt3Tu5zEw80",
    authDomain: "rollcall-4f68e.firebaseapp.com",
    databaseURL: "https://rollcall-4f68e-default-rtdb.firebaseio.com",
    projectId: "rollcall-4f68e",
    storageBucket: "rollcall-4f68e.appspot.com",
    messagingSenderId: "968520920745",
    appId: "1:968520920745:web:73411f874a1b9f1ce343b8",
    measurementId: "G-RP81FY5G3D"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Global variable to store role and authentication status
let isInstructor = false;

/**
 * Function to handle Google login.
 * Prompts the user to select an account and logs in with Google.
 */
async function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
        'prompt': 'select_account'
        // 'hd': 'uri.edu',
    });

    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;

        await saveUserData(user);
        await updateUserRole(user.uid);
        window.location.href = "/classes";

        // Check if the email domain is uri.edu
        //if (emailDomain !== 'uri.edu') {
        //    await auth.signOut();
        //    alert('Only URI.edu emails are allowed.');
        //} else {
        //    await saveUserData(user);
        //    window.location.href = "/classes";
        //}

    } catch (error) {
        console.error("Sign in error:", error);
        alert("Sign in failed. Please try again.");
    }
}

/**
 * Function to save user data to Firebase.
 * @param {object} user - The authenticated user object.
 */
async function saveUserData(user) {
    const userRef = database.ref('users/' + user.uid);
    const snapshot = await userRef.once('value');

    if (snapshot.exists()) {
        const existingData = snapshot.val();
        await userRef.update({
            firstName: existingData.firstName || user.displayName.split(' ')[0],
            lastName: existingData.lastName || user.displayName.split(' ').slice(1).join(' '),
            email: existingData.email || user.email,
            isInstructor: existingData.isInstructor || false, // Default isInstructor set to false
            Classes: existingData.Classes || {}
        });
    } else {
        await userRef.set({
            firstName: user.displayName.split(' ')[0],
            lastName: user.displayName.split(' ').slice(1).join(' '),
            email: user.email,
            isInstructor: false, // Default isInstructor set to false
            Classes: {}
        });
    }
}

/**
 * Function to get current user data.
 * @returns {object|null} - The user data object or null if not authenticated.
 */
function getUserData() {
    const user = firebase.auth().currentUser;
    if (user) {
        return {
            displayName: user.displayName,
            email: user.email,
            uid: user.uid,
            isInstructor: isInstructor
        };
    }
    return null;
}

/**
 * Function to update the user's role in the global variable.
 * @param {string} userId - The user ID.
 */
async function updateUserRole(userId) {
    const userRef = database.ref('users/' + userId);
    const snapshot = await userRef.once('value');

    if (snapshot.exists()) {
        isInstructor = snapshot.val().isInstructor || false;
        // Store the isInstructor value in session storage
        sessionStorage.setItem('isInstructor', isInstructor);
    }
}

/**
 * Function to get the instructor status.
 * @returns {boolean} - True if the user is an instructor, otherwise false.
 */
function getIsInstructor() {
    return sessionStorage.getItem('isInstructor') === 'true';
}

/**
 * Function to check if the user is authenticated.
 * @returns {boolean} - True if the user is authenticated, otherwise false.
 */
function isUserAuthenticated() {
    return !!auth.currentUser;
}

/**
 * Function to handle user logout.
 */
async function logout() {
    isInstructor = false;
    try {
        await auth.signOut();
        console.log("User signed out.");
    } catch (error) {
        console.error("Sign out error:", error);
        alert("Sign out failed. Please try again.");
    }
}

/**
 * Function to resynchronize the login session.
 * Updates the user's role based on their current session.
 */
async function resyncLoginSession() {
    const user = auth.currentUser;
    if (user) {
        await updateUserRole(user.uid);
    } else {
        isInstructor = false;
    }
}

/**
 * Function to toggle collapse for elements with the specified class name.
 * @param {string} className - The class name of the element to toggle.
 */
function toggleCollapse(className) {
    const element = document.getElementById(className);
    if (element) {
        $(element).collapse('toggle');
    }
}

// Expose functions to the global scope
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.saveUserData = saveUserData;
window.getUserData = getUserData;
window.updateUserRole = updateUserRole;
window.getIsInstructor = getIsInstructor;
