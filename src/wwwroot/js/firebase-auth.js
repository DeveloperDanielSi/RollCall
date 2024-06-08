window.addEventListener('load', () => {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not detected. You must include the Firebase SDK in your index.html file.');
        return;
    }

    // Initialize Firebase
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
    firebase.initializeApp(firebaseConfig);

    function loginWithGoogle() {
        var provider = new firebase.auth.GoogleAuthProvider();
        return firebase.auth().signInWithPopup(provider).then((result) => {
            // Check email domain
            var email = result.user.email;
            if (!email.endsWith('@uri.edu')) {
                alert('Only uri.edu emails are allowed.');
                firebase.auth().signOut();
                return;
            }

            // Check if user exists in the database
            var userRef = firebase.database().ref('users/' + result.user.uid);
            userRef.once('value', (snapshot) => {
                if (!snapshot.exists()) {
                    saveUserData(result.user);
                }
            });
        }).catch((error) => {
            console.error("Sign in error:", error);
            throw new Error(error.message);
        });
    }

    function saveUserData(user) {
        const userRef = firebase.database().ref('users/' + user.uid);
        userRef.set({
            firstName: user.displayName.split(' ')[0],
            lastName: user.displayName.split(' ').slice(1).join(' '),
            email: user.email
        });
    }

    function logout() {
        return firebase.auth().signOut().then(() => {
            console.log("User signed out.");
        }).catch((error) => {
            console.error("Sign out error:", error);
            throw new Error(error.message);
        });
    }

    function onAuthStateChanged(callback) {
        return firebase.auth().onAuthStateChanged(user => {
            DotNet.invokeMethodAsync('RollCall', 'OnAuthStateChanged', !!user);
        });
    }

    function isUserAuthenticated() {
        return !!firebase.auth().currentUser;
    }

    // Expose functions to the global scope
    window.loginWithGoogle = loginWithGoogle;
    window.logout = logout;
    window.onAuthStateChanged = onAuthStateChanged;
    window.isUserAuthenticated = isUserAuthenticated;
    window.saveUserData = saveUserData;
});
