const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.markAbsentForMissingAttendance = functions.pubsub.schedule('0 20 * * *').timeZone('America/New_York').onRun(async (context) => {
    const db = admin.database();
    const classesRef = db.ref('classes');
    const currentDate = getCurrentFormattedDate(); // Get the current date in 'YYYY-MM-DD' format

    try {
        // Get all classes from the database
        const classesSnapshot = await classesRef.once('value');
        const classes = classesSnapshot.val();

        // Loop through each class
        for (const classId in classes) {
            const classData = classes[classId];
            const students = classData.students || {};

            // For each class, first check if the current date exists in the 'dates' field
            const datesString = students.dates || '';
            const dates = datesString.split(',');

            // If the current date is not in the class's dates, skip to the next class
            if (!dates.includes(currentDate)) {
                console.log(`Class ${classId} does not have the current date.`);
                continue;
            }

            // Loop through each student in the class
            for (const studentName in students) {
                if (studentName === 'dates') continue; // Skip the 'dates' field

                const attendanceRecord = students[studentName].split(',');

                // Find the index for the current date
                const dateIndex = dates.indexOf(currentDate);

                // If the attendance for this date is null/empty, mark it as absent ("A")
                if (!attendanceRecord[dateIndex]) {
                    attendanceRecord[dateIndex] = 'A';
                    console.log(`Marking ${studentName} absent for class ${classId} on ${currentDate}.`);

                    // Update the attendance record for this student in the database
                    await classesRef.child(`${classId}/students/${studentName}`).set(attendanceRecord.join(','));
                }
            }
        }

        console.log('Attendance marking completed.');
    } catch (error) {
        console.error('Error while marking attendance:', error);
    }

    return null;
});

/**
 * Utility function to get the current date in 'YYYY-MM-DD' format
 */
function getCurrentFormattedDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure two-digit month
    const day = String(date.getDate()).padStart(2, '0'); // Ensure two-digit day
    return `${year}-${month}-${day}`;
}
