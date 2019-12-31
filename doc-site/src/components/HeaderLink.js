import React from 'react';
import styled from 'styled-components';

const HeaderA = styled.a`
    padding-left: 20px;
    padding-right: 20px;
    font-size: 18px;
    display: flex;
    flex-direction: row;
    align-items: center;
    color: ${props => (props.isActive ? '#79b6f2' : '#ffffff')};
    border-bottom-style: solid;
    border-bottom-width: 3px;
    border-bottom-color: ${props => (props.isActive ? '#79b6f2' : 'transparent')};
    transition: color 0.2s ease-out;
    font-weight: 300;
    text-decoration: none;
    &:hover {
        color: #79b6f2;
    }
`;

export default function HeaderLink({ isActive, href, children }) {
    return (
        <HeaderA className="header-link" href={href} isActive={isActive}>
            {children}
        </HeaderA>
    );
}
