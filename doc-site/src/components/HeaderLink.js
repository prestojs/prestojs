import React from 'react';
import { Link } from 'gatsby';
import styled from 'styled-components';

const StyledLink = styled(Link)`
    padding-left: 20px;
    padding-right: 20px;
    font-size: 18px;
    display: flex;
    flex-direction: row;
    align-items: center;
    color: ${props => (props.isActive ? props.theme.color1 : '#ffffff')};
    border-bottom-style: solid;
    border-bottom-width: 3px;
    border-bottom-color: ${props => (props.isActive ? props.theme.color1 : 'transparent')};
    transition: color 0.2s ease-out;
    font-weight: 300;
    text-decoration: none;
    &:hover {
        color: ${props => props.theme.color1};
    }
`;

export default function HeaderLink({ isActive, to, children }) {
    return (
        <StyledLink className="header-link" to={to} isActive={isActive}>
            {children}
        </StyledLink>
    );
}
