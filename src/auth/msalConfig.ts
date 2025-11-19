import { PublicClientApplication, Configuration, RedirectRequest } from "@azure/msal-browser";

const msalConfig: Configuration = {
    auth: {
        clientId: import.meta.env.VITE_MSAL_CLIENT_ID || "fbd9d6a2-67fb-4364-88e0-850b11c75db9",
        authority: import.meta.env.VITE_MSAL_AUTHORITY || "https://login.microsoftonline.com/7026ecbb-b41e-4aa0-9e68-a41eb80634fe",
        redirectUri: import.meta.env.VITE_MSAL_REDIRECT_URI || window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case 0:
                        console.error(message);
                        return;
                    case 1:
                        console.warn(message);
                        return;
                    case 2:
                        console.info(message);
                        return;
                    case 3:
                        console.debug(message);
                        return;
                }
            },
            piiLoggingEnabled: false
        }
    }
};

export const loginRequest: RedirectRequest = {
    scopes: ["User.Read", "Sites.Read.All", "Files.ReadWrite.All"],
};

export const msalInstance = new PublicClientApplication(msalConfig);
