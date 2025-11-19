import { useMsalAuthentication, useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionType } from "@azure/msal-browser";
import { loginRequest } from "../auth/msalConfig";
import { useEffect } from "react";

const useAuth = () => {
    const { login, result, error } = useMsalAuthentication(InteractionType.Redirect, loginRequest);
    const isAuthenticated = useIsAuthenticated();
    const { instance, accounts } = useMsal();

    useEffect(() => {
        if (error) {
            console.error("Authentication error:", error);
        }
    }, [error]);

    const logout = () => {
        instance.logoutRedirect({
            account: accounts[0]
        });
    };

    const getAccessToken = async () => {
        try {
            const response = await instance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0]
            });
            return response.accessToken;
        } catch (error) {
            console.error("Token acquisition error:", error);
            // Fall back to interactive method
            const response = await instance.acquireTokenRedirect(loginRequest);
            return response?.accessToken;
        }
    };

    return {
        isAuthenticated,
        login,
        logout,
        result,
        error,
        user: accounts[0],
        getAccessToken
    };
};

export default useAuth;
