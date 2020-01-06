import React from 'react';
import styled from 'styled-components';

const SidebarOuter = styled.div`
    flex: 0 0 300px;
    margin-right: 50px;
`;
const SidebarInner = styled.div`
    position: fixed;
    top: ${props => props.theme.headerHeight};
    height: calc(100vh - ${props => props.theme.headerHeight});
    border-right: 1px solid #ececec;
    overflow-y: auto;
    background-color: #f7f7f7;
    padding-top: 20px;
    margin-left: -1000px;
    padding-left: 1000px;
`;

export default function Sidebar({ children }) {
    return (
        <SidebarOuter>
            <SidebarInner>{children}</SidebarInner>
        </SidebarOuter>
    );
}
