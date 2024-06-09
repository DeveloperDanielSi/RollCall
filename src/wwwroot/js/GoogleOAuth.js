let blazorSchoolAuthenticationStateProviderInstance = null;

function blazorSchoolGoogleInitialize(clientId, blazorSchoolAuthenticationStateProvider) {
    blazorSchoolAuthenticationStateProviderInstance = blazorSchoolAuthenticationStateProvider;
    google.accounts.id.initialize({ client_id: clientId, callback: blazorSchoolCallback });
}

function blazorSchoolGooglePrompt() {
    google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.info(notification.getNotDisplayedReason());
            console.info(notification.getSkippedReason());
        }
    });
}

function blazorSchoolCallback(googleResponse) {
    blazorSchoolAuthenticationStateProviderInstance.invokeMethodAsync("GoogleLogin", { ClientId: googleResponse.clientId, SelectedBy: googleResponse.select_by, Credential: googleResponse.credential });
}