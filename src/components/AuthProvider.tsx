import React from "react";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "../auth/msalConfig";

interface AuthProviderProps {
    children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    return (
        <MsalProvider instance={msalInstance}>
            {children}
        </MsalProvider>
    );
};

export default AuthProvider;
