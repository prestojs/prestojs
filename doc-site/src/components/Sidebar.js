import React from 'react';
import styled from 'styled-components';

const StyledSidebar = styled.div`
    position: fixed;
    top: 60px;
    left: 0;
    background-color: #f7f7f7;
    height: calc(100vh - 60px);
    border-right: 1px solid #ececec;
    overflow-y: auto;
    width: 300px;
`;

export default function Sidebar({ children }) {
    return <StyledSidebar>{children}</StyledSidebar>;
}
