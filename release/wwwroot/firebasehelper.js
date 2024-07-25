/* ----------------------------------- createclasses.js ----------------------------------- */

/**
 * Saves class data and CSV data to Firebase.
 * @param {string} uid - The unique identifier for the class.
 * @param {object} classData - The data associated with the class.
 * @param {object} csvData - The CSV data to be saved.
 */
window.saveClassData = async function (uid, classData, csvData) {
    try {
        // Save class data to the "classes" node under the given UID
        await database.ref(`classes/${uid}`).set(classData);

        // Save CSV data to the "Dates" node within the "students" of the given class
        await database.ref(`classes/${uid}/students/dates`).set(csvData);

        console.log("Class and CSV data saved successfully to Firebase.");
    } catch (error) {
        console.error("Error saving data:", error);
    }
};

/* ------------------------------------- classes.js ------------------------------------- */

/**
 * Fetches the classes created by a specific instructor.
 * @param {string} email - The email address of the instructor.
 * @returns {Array} - An array of classes created by the instructor.
 */
window.getClassesByInstructor = async function (email) {
    try {
        // Query the "classes" node for classes created by the specified email
        const snapshot = await database.ref('classes').orderByChild('creatorEmail').equalTo(email).once('value');
        const classes = [];
        snapshot.forEach(childSnapshot => {
            const classData = childSnapshot.val();
            classData.ClassId = childSnapshot.key; // Add ClassId to each class data
            classes.push(classData);
        });
        return classes;
    } catch (error) {
        console.error('Error fetching classes:', error);
        return null;
    }
};

/**
 * Fetches the classes that a specific student is enrolled in.
 * @param {string} uid - The unique identifier of the student.
 * @returns {Array} - An array of classes that the student is enrolled in.
 */
window.getClassesForStudent = async function (uid) {
    try {
        // Retrieve class IDs for the given student from their "classes" node
        const snapshot = await database.ref('users/' + uid + '/classes').once('value');
        const classIds = [];
        snapshot.forEach(childSnapshot => {
            classIds.push(childSnapshot.key); // Collect class IDs
        });

        const classes = [];
        for (const classId of classIds) {
            // Retrieve class data for each class ID
            const classSnapshot = await database.ref('classes/' + classId).once('value');
            const classData = classSnapshot.val();
            classData.ClassId = classSnapshot.key; // Add ClassId to each class data
            classes.push(classData);
        }

        return classes;
    } catch (error) {
        console.error('Error fetching student classes:', error);
        return null;
    }
};

/**
 * Generates a unique invite code and stores it in Firebase.
 * @param {string} classId - The unique identifier of the class.
 * @param {string} className - The name of the class.
 * @returns {object} - An object containing the invite code and a success message.
 */
window.generateInviteCode = async function (classId, className) {
    try {
        const inviteCode = generateUniqueCode(); // Generate a unique invite code
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 4); // Set invite code expiry to 4 hours from now
        await firebase.database().ref('inviteCodes/' + inviteCode).set({
            ClassId: classId,
            Expiry: expiry.toISOString()
        });

        return { inviteCode, successMessage: `Invite link successfully generated for ${className}: ${inviteCode}` };
    } catch (error) {
        console.error('Error generating invite code:', error);
        return { errorMessage: `Error generating invite code: ${error.message}` };
    }
};

/**
 * Generates a unique code for invites.
 * @returns {string} - The generated unique invite code.
 */
function generateUniqueCode() {
    return 'INV-' + Math.random().toString(36).substring(2, 11).toUpperCase();
}


/**
 * Allows a user to join a class using an invite code.
 * @param {string} inviteCode - The invite code for the class.
 * @param {string} userUID - The unique identifier of the user.
 * @param {string} userDisplayName - The display name of the user.
 * @returns {object} - An object with a success or error message.
 */
window.joinClass = async function (inviteCode, userUID, userDisplayName) {
    try {
        const inviteRef = firebase.database().ref('inviteCodes/' + inviteCode);
        const inviteSnapshot = await inviteRef.once('value');
        const invite = inviteSnapshot.val();

        if (invite && new Date(invite.Expiry) > new Date()) {
            const classId = invite.ClassId;
            const classRef = firebase.database().ref('classes/' + classId);
            const classSnapshot = await classRef.once('value');
            const classData = classSnapshot.val();
            const dates = classData.students?.dates ? classData.students.dates.split(',') : [];
            const initializeStudent = new Array(dates.length).fill(',').join('');

            // Set the student's data and enrollment status
            await firebase.database().ref('users/' + userUID + '/classes/' + classId).set(true);
            await classRef.child('students').child(userDisplayName).set(initializeStudent);
            await classRef.child('studentsEnrolled').child(userUID).set(true);

            return { successMessage: "Class joined successfully!" };
        } else {
            return { errorMessage: "Invalid or expired invite code." };
        }
    } catch (error) {
        console.error('Error joining class:', error);
        return { errorMessage: `Error joining class: ${error.message}` };
    }
};

/**
 * Deletes a class and removes all associated data.
 * @param {string} classId - The unique identifier of the class to delete.
 */
window.deleteClass = async function (classId) {
    try {
        // Retrieve all student UIDs enrolled in the class
        const classRef = database.ref(`classes/${classId}/studentsEnrolled`);
        const snapshot = await classRef.once('value');
        const studentUids = snapshot.val();

        if (typeof studentUids !== 'object' || studentUids === null) {
            console.error("Error: studentUids is not an object.");
            throw new Error("Error: studentUids is not an object.");
        }

        // Remove the class from each student's list of enrolled classes
        for (const uid in studentUids) {
            if (studentUids.hasOwnProperty(uid)) {
                const userRef = database.ref(`users/${uid}/classes/${classId}`);
                await userRef.remove();
            }
        }

        // Remove the class data from Firebase
        const classDataRef = database.ref(`classes/${classId}`);
        await classDataRef.remove();

        console.log("Class deleted successfully!");
    } catch (error) {
        console.error("Error deleting class: ", error.message);
        throw new Error(error.message);
    }
};

/**
 * Records attendance for a student in a specific class.
 * @param {string} classId - The unique identifier of the class.
 * @param {string} studentUid - The UID of the student.
 * @param {string} studentDisplayName - The display name of the student.
 * @param {string} checkinLocation - The location where the check-in is occurring.
 */
async function recordAttendance(classId, studentUid, studentDisplayName, checkinLocation) {
    try {
        // Get current date in YYYY-M-D format
        const currentDate = new Date();
        const formattedCurrentDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;

        // Fetch class data
        const classSnapshot = await firebase.database().ref(`classes/${classId}`).once('value');
        const classData = classSnapshot.val();

        if (!classData) {
            throw new Error("Missing class data details.");
        }

        // Debugging: Log class data
        console.log("Class data:", classData);

        // Fetch student data
        const studentSnapshot = await firebase.database().ref(`classes/${classId}/students/${studentDisplayName}`).once('value');
        const studentData = studentSnapshot.val();

        if (studentData === null) {
            throw new Error(`No student data found for displayName: ${studentDisplayName}`);
        }

        // Fetch dates
        const datesSnapshot = await firebase.database().ref(`classes/${classId}/students/dates`).once('value');
        const datesData = datesSnapshot.val();
        const dates = datesData ? datesData.split(',') : [];

        // Debugging: Log data
        console.log("Student data:", studentData);
        console.log("Dates data:", datesData);

        // Check if current date is in the list of dates
        const isValidDate = dates.includes(formattedCurrentDate);

        if (!isValidDate) {
            throw new Error("Incorrect date: The current date is not included in the class dates.");
        }

        // Convert time strings to minutes
        const classStartTime = classData.classStartTime; // Handle both possible cases
        const lateMinutes = classData.lateMinutes;
        const absentMinutes = classData.absentMinutes;

        // Debugging: Log class start time
        console.log("Class start time:", classStartTime);

        // Handle possible incorrect format or missing data
        if (!classStartTime || isNaN(lateMinutes) || isNaN(absentMinutes)) {
            throw new Error("Class time or minute settings are not correctly configured.");
        }

        const classStartDate = new Date(`1970-01-01T${classStartTime}:00`);
        const classStartTimeInMinutes = classStartDate.getHours() * 60 + classStartDate.getMinutes();
        const lateTimeInMinutes = classStartTimeInMinutes + lateMinutes;
        const absentTimeInMinutes = classStartTimeInMinutes + absentMinutes;

        const checkinDateTime = new Date();
        const checkinTimeInMinutes = checkinDateTime.getHours() * 60 + checkinDateTime.getMinutes();

        // Debugging: Log time calculations
        console.log("Class start time (minutes):", classStartTimeInMinutes);
        console.log("Late time (minutes):", lateTimeInMinutes);
        console.log("Absent time (minutes):", absentTimeInMinutes);
        console.log("Check-in time (minutes):", checkinTimeInMinutes);

        let checkinValue = '';

        // Determine checkin value based on timing
        if (checkinTimeInMinutes < classStartTimeInMinutes - 60) {
            throw new Error("Error: The soonest you can check in is within an hour of the class start time.");
        } else if (checkinTimeInMinutes <= lateTimeInMinutes) {
            checkinValue = 'O'; // On-time
        } else if (checkinTimeInMinutes <= absentTimeInMinutes) {
            checkinValue = 'L'; // Late
        } else {
            checkinValue = 'A'; // Absent
        }

        // Update attendance values
        const attendanceValues = studentData.split(',');
        const dateIndex = dates.indexOf(formattedCurrentDate);

        if (dateIndex === -1) {
            throw new Error("Error: Date not found in the student's attendance dates.");
        }

        attendanceValues[dateIndex] = checkinValue;

        // Prepare the data object for update
        const updateData = {
            [`classes/${classId}/students/${studentDisplayName}`]: attendanceValues.join(',')
        };

        // Update Firebase
        await firebase.database().ref().update(updateData);

        console.log(`Attendance recorded successfully for ${studentDisplayName} on ${formattedCurrentDate}.`);

        return {
            successMessage: `Attendance recorded successfully for ${studentDisplayName} on ${formattedCurrentDate}.`,
            errorMessage: ''
        };
    } catch (error) {
        console.error(`Error recording attendance: ${error.message}`);
    }
}

/**
 * Calculates the distance between two geographical points using the Haversine formula.
 * @param {number} lat1 - Latitude of the first point.
 * @param {number} lng1 - Longitude of the first point.
 * @param {number} lat2 - Latitude of the second point.
 * @param {number} lng2 - Longitude of the second point.
 * @returns {number} - The distance between the two points in meters.
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Converts degrees to radians.
 * @param {number} degrees - The degrees to be converted to radians.
 * @returns {number} - The equivalent radians.
 */
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

/* ----------------------------------- reporting.js ----------------------------------- */

/**
 * Loads classes for reporting based on user data and role.
 * @param {object} userData - The data of the user (including email or UID).
 * @param {boolean} isInstructor - Flag indicating if the user is an instructor.
 * @returns {string} - A JSON string representing the classes.
 */
window.loadClassesReporting = async function (userData, isInstructor) {
    const firebaseClient = firebase.database();
    let classes = [];

    try {
        if (isInstructor) {
            // Load all classes and filter by instructor's email
            const snapshot = await firebaseClient.ref('classes').get();
            snapshot.forEach(childSnapshot => {
                const classData = childSnapshot.val();
                if (classData.creatorEmail === userData.email) {
                    classes.push({
                        classId: childSnapshot.key,
                        className: classData.className,
                        creatorEmail: classData.creatorEmail,
                        students: classData.students
                    });
                }
            });
        } else {
            // Load classes for the student based on their enrolled class IDs
            const studentClassesSnapshot = await firebaseClient.ref(`users/${userData.uid}/classes`).get();
            const enrolledClassIds = [];
            studentClassesSnapshot.forEach(childSnapshot => {
                enrolledClassIds.push(childSnapshot.key);
            });

            for (const classId of enrolledClassIds) {
                const classDataSnapshot = await firebaseClient.ref(`classes/${classId}`).get();
                const classData = classDataSnapshot.val();
                classData.classId = classId; // Add classId to each class data
                classes.push(classData);
            }
        }
    } catch (error) {
        throw new Error(`Error loading classes: ${error.message}`);
    }

    return JSON.stringify(classes); // Return classes as a JSON string
};

/**
 * Saves edited class data to Firebase.
 * @param {string} classId - The unique identifier of the class.
 * @param {object} editedStudents - The updated student data for the class.
 * @returns {string} - Success message indicating the data was saved.
 */
window.saveClass = async function (classId, editedStudents) {
    const firebaseClient = firebase.database();
    try {
        // Save updated student data to the specified class
        await firebaseClient.ref(`classes/${classId}/students`).set(editedStudents);
        return "Class data saved successfully!";
    } catch (error) {
        throw new Error(`Error saving class data: ${error.message}`);
    }
};

/**
 * Exports class data as a CSV file.
 * @param {string} classId - The unique identifier of the class to export.
 */
window.exportCSV = async function (classId) {
    const firebaseClient = firebase.database();
    let csvString = "";

    try {
        // Retrieve class data
        const classDataSnapshot = await firebaseClient.ref(`classes/${classId}`).get();
        const classData = classDataSnapshot.val();

        if (classData && classData.students) {
            // Process dates and students for CSV export
            const dates = classData.students.dates ? classData.students.dates.split(',') : [];

            if (dates.length > 0) {
                csvString = "dates," + dates.join(",") + "\n";

                for (const student in classData.students) {
                    if (student !== "dates") {
                        const attendanceList = classData.students[student].split(',');
                        while (attendanceList.length < dates.length) {
                            attendanceList.push('');
                        }
                        csvString += `${student},` + attendanceList.join(",") + "\n";
                    }
                }

                // Generate a download link for the CSV file
                const className = classData.className;
                const safeFileName = className.replace(/[\/\\?%*:|"<>]/g, '_'); // Sanitize filename
                const link = document.createElement("a");
                link.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvString);
                link.target = '_blank';
                link.download = `${safeFileName}.csv`;
                link.click();
            } else {
                throw new Error('No dates found for this class.');
            }
        } else {
            throw new Error('No data found for this class.');
        }
    } catch (error) {
        console.error(`Error exporting CSV: ${error.message}`);
        alert(`Error exporting CSV: ${error.message}`);
    }
};

/**
 * Opens a file dialog to upload a CSV file and returns its content.
 * @returns {Promise<string>} - A promise that resolves with the content of the uploaded CSV file.
 */
window.uploadCSV = function () {
    return new Promise((resolve, reject) => {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';

        input.onchange = e => {
            var file = e.target.files[0];
            var reader = new FileReader();

            reader.onload = event => {
                resolve(event.target.result); // Resolve with the file content
            };

            reader.onerror = error => {
                reject(error); // Reject if there is an error
            };

            reader.readAsText(file); // Read the file as text
        };

        input.click(); // Open file dialog
    });
};
