import React from 'react';
import { BrowserRouter as Router, Route, Routes,Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import { isLoggedIn } from "./auth"; 




function App() {
    return (
        <Router>
            <Routes>
           
       
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />
         

            </Routes>
        </Router>
    );
}

export default App;
