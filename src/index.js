import React from 'react';
import { render } from 'react-dom';
import App from './components/App';

const wrapper = document.getElementById('root');
wrapper ? render(<App />, wrapper) : false;
