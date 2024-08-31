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
