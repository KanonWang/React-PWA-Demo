import React from 'react';
import { render } from 'react-dom';
import App from './components/App';

const init = () => {
    const wrapper = document.getElementById('root');
    wrapper ? render(<App />, wrapper) : false;

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('SW registered: ', registration);
            }).catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
        });
    }
};

init();
