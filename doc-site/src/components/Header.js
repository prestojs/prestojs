import { Link } from 'gatsby';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import HeaderLink from './HeaderLink';

const isActive = section => typeof window !== 'undefined' && window.location.href.includes(section);

const Nav = styled.nav`
    height: ${props => props.theme.headerHeight};
    display: flex;
    width: 60%;
`;

const StyledHeader = styled.header`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 5;
    background-color: ${props => props.theme.color5};
    margin-bottom: 1.45rem;
    height: ${props => props.theme.headerHeight};
`;

const TitleLink = styled(Link)`
    color: white;
    text-decoration: none;
    width: calc(100% / 6);
`;

const HeaderInner = styled.div`
    margin: 0 auto;
    max-width: 1260px;
    padding: 1.45rem 1.0875rem;
    display: flex;
    height: 100%;
    align-items: center;
`;

const Header = ({ siteTitle }) => (
    <StyledHeader>
        <HeaderInner>
            <TitleLink to="/">{siteTitle}</TitleLink>
            <Nav>
                <HeaderLink isActive={isActive('docs')} to="/docs/getting-started.html">
                    Docs
                </HeaderLink>
                <HeaderLink isActive={isActive('tutorial')} to="/tutorial/start.html">
                    Tutorial
                </HeaderLink>
                <HeaderLink isActive={isActive('api')} to="/api/@prestojs/viewmodel/ViewModel.html">
                    API
                </HeaderLink>
            </Nav>
            <a
                href="https://github.com/prestojs/prestojs"
                target="_blank"
                rel="noopener noreferrer"
            >
                GitHub
            </a>
        </HeaderInner>
    </StyledHeader>
);

Header.propTypes = {
    siteTitle: PropTypes.string,
};

Header.defaultProps = {
    siteTitle: ``,
};

export default Header;
