import React from 'react';
import { render } from 'react-dom';
import App from './components/App';

const init = () => {
    const wrapper = document.getElementById('root');
    wrapper ? render(<App />, wrapper) : false;

// Register A service worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js').then(registration => {
                console.log('SW registered: ', registration);
            }).catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
        });
    }
};

init();
