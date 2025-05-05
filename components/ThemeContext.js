// ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('dark'); // Default to dark theme

    useEffect(() => {
        // Load theme from cookie on initial mount (client-side)
        const savedTheme = Cookies.get('theme');
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    useEffect(() => {
        // Save theme to cookie whenever it changes
        Cookies.set('theme', theme, { expires: 365 }); // Expires in 365 days
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);