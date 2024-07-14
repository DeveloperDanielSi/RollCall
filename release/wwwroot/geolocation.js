// Define the geolocation object if not already defined
window.locationTesting = window.locationTesting || {};

/**
 * Initializes the geolocation event listener.
 */
window.locationTesting.initialize = function () {
    // Get the elements by their IDs
    const locationButton = document.getElementById('locationButton');
    const targetElement = document.getElementById('target'); // Get the target element by ID

    // Check if the elements exist
    if (locationButton && targetElement) {
        // Add the event listener to the button
        locationButton.addEventListener('click', function () {
            navigator.geolocation.getCurrentPosition(function (position) {
                // Store latitude and longitude in variables
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                // Display latitude and longitude in the target element
                targetElement.innerText = `Latitude: ${latitude}, Longitude: ${longitude}`;

                // Set the global target variable as a string
                window.locationTesting.target = `${latitude},${longitude}`;

                // Trigger the event to notify Blazor
                const event = new CustomEvent('locationReady', {
                    detail: {
                        target: window.locationTesting.target
                    }
                });
                document.dispatchEvent(event);
            }, function (error) {
                console.error("Error Code = " + error.code + " - " + error.message);
            });
        });
    } else {
        console.error("Elements with ID 'locationButton' or 'target' not found.");
    }
};

// Initialize the geolocation listener on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
    window.locationTesting.initialize();
});

// Function to get the target value
window.locationTesting.getTarget = function () {
    return window.locationTesting.target || "";
};
