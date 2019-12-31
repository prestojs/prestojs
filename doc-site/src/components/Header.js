import { Link } from 'gatsby';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import HeaderLink from './HeaderLink';

const isActive = section => typeof window !== 'undefined' && window.location.href.includes(section);

const Nav = styled.nav`
    height: 60px;
    display: flex;
    width: 60%;
`;

const StyledHeader = styled.header`
    background-color: #282c34;
    margin-bottom: 1.45rem;
    height: 60px;
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
                <HeaderLink isActive={isActive('docs')} href="/docs/getting-started.html">
                    Docs
                </HeaderLink>
                <HeaderLink isActive={isActive('tutorial')} href="/tutorial/start.html">
                    Tutorial
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
