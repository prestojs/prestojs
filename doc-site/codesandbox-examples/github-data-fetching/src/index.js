import '@prestojs/ui-antd/styles.css';

import 'antd/dist/antd.css';
import React from 'react';
import ReactDOM from 'react-dom';

import FollowerList from './FollowerList';
import './tailwind.css';

const rootElement = document.getElementById('root');
ReactDOM.render(<FollowerList />, rootElement);
