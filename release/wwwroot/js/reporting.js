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
