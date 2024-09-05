// Define the geolocation object
window.geoLocation = window.geoLocation || {};

/**
 * Initializes the geolocation event listener.
 */
window.geoLocation.initialize = function () {
    const targetElement = document.getElementById('target'); // Get the target element by ID

    // Call the geolocation API directly
    navigator.geolocation.getCurrentPosition(function (position) {
        // Store latitude and longitude in variables
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        // Display latitude and longitude in the target element
        if (targetElement) {
            targetElement.innerText = `Latitude: ${latitude}, Longitude: ${longitude}`;
        }

        // Set the global target variable as a string
        window.geoLocation.target = `${latitude},${longitude}`;

        // Trigger the event to notify Blazor
        const event = new CustomEvent('locationReady', {
            detail: {
                target: window.geoLocation.target
            }
        });
        document.dispatchEvent(event);
    }, function (error) {
        console.error("Error Code = " + error.code + " - " + error.message);
    });
};

// Initialize the geolocation listener on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
    // Specify the Blazor routes where geolocation should be requested
    const specificPages = ['/classes', '/classes/create']; // Blazor routes

    // Check if the current route is one of the specific pages
    if (specificPages.includes(window.location.pathname)) {
        window.geoLocation.initialize();
    }
});

// Function to get the target value
window.geoLocation.getTarget = function () {
    return window.geoLocation.target || "";
};
