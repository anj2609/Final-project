import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import { isLoggedIn } from "./auth"; 



function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [headers, setHeaders] = useState(null);


    const navigate = useNavigate(); 
    useEffect(() => {
        const loggedIn = isLoggedIn(); 

        console.log(loggedIn);
        if (loggedIn) {
          navigate("/dashboard", { replace: true });
        }
      }, [navigate]); 

      
      
    

    const handleLogin = async (event) => {
        event.preventDefault();

        const payload = new URLSearchParams();
        payload.append("grant_type", "password");
        payload.append("username", username);
        payload.append("password", password);

        const loginUrl = "https://akgecerp.edumarshal.com/Token";

        try {
            const response = await axios.post(loginUrl, payload, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });

            const data = response.data;
            console.log(data)
            if (data && data.access_token && data.SessionId && data['X-UserId'] && data.X_Token) {

                localStorage.setItem("authToken", data.access_token);

                const newHeaders = {
                    'Authorization': `Bearer ${data.access_token}`,
                    'X-Wb': '1',
                    'Sessionid': data.SessionId,
                    'X-Contextid': '194',
                    'X-Userid': data['X-UserId'],
                    'X_token': data.X_Token,
                    'X-Rx': '1'
                };

                localStorage.setItem('authHeaders', JSON.stringify(newHeaders));
                localStorage.setItem('isAuthenticated', true);
                
                setHeaders(newHeaders); 

                setStatusMessage("Login successful!");




                navigate('/dashboard', { state: { headers: newHeaders } }); 

            } else {
                setStatusMessage("Login failed: Missing required data in response.");
            }
        } catch (error) {
            setStatusMessage(`Error: ${error.response?.data?.error || error.message}`);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">EduMarshal Login</h2>
                
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-gray-700 text-sm font-medium mb-2">Username:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        />
                    </div>

                    <button type="submit" className="w-full bg-[#6366F1] text-white py-2 rounded-md  focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:ring-opacity-50">
                        Login
                    </button>
                </form>

                {statusMessage && (
                    <p className="mt-4 text-center text-red-600 text-sm">{statusMessage}</p>
                )}
            </div>
        </div>
    );
}

export default Login;
