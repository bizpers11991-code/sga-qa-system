import React from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../auth/msalConfig";

const Login: React.FC = () => {
    const { instance } = useMsal();

    const handleLogin = async () => {
        try {
            await instance.loginRedirect(loginRequest);
        } catch (error) {
            console.error("Login error:", error);
            // Handle login error (e.g., display an error message)
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        SGA QA Pack
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in with your Microsoft account
                    </p>
                </div>
                <div className="mt-8">
                    <button
                        onClick={handleLogin}
                        className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                        <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
                        </svg>
                        Sign in with Microsoft
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
