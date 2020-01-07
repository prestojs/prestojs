import React, { useState } from 'react';
import { Link } from 'gatsby';
import styled from 'styled-components';

import ChevronIcon from '../assets/icon-right-chevron.svg';

const List = styled.ul`
    min-width: 200px;
    list-style: none;
    margin: 0;
`;

const StyledLink = styled(Link)`
    &:hover {
        color: rgb(100, 100, 100);
    }
`;

const Title = styled.div`
    button {
        font-weight: 700;
        color: ${props => (props.isActive ? 'rgb(25, 25, 25)' : 'rgb(100, 100, 100)')};
        text-transform: uppercase;
        cursor: pointer;
        &:hover {
            color: rgb(25, 25, 25);
        }
    }
    margin-bottom: 30px;
    margin-top: 30px;
`;

const isActive = href =>
    typeof window !== `undefined` &&
    window.location.pathname.startsWith(href.startsWith('/') ? href : `/${href}`);

const isOpen = children => {
    for (const child of children) {
        if (isActive(child.href)) {
            return true;
        }
    }
    return false;
};
const ToggleButton = styled.button`
    background-color: transparent;
    border: none;
`;

const Chevron = styled(ChevronIcon)`
    margin-left: 20px;
    height: 1em;
    transform: rotateZ(${props => (props.isOpen ? '270deg' : '90deg')});
`;

function CollapsableListItem({ title, children, isActive }) {
    const [isOpen, setIsOpen] = useState(isActive);

    const id = title;
    return (
        <li>
            <Title isActive={isActive}>
                <ToggleButton
                    aria-expanded={isOpen}
                    aria-controls={id}
                    onClick={() => setIsOpen(open => !open)}
                >
                    {title}
                    <Chevron isOpen={isOpen} />
                </ToggleButton>
            </Title>
            {React.cloneElement(children, { id, style: { display: isOpen ? 'block' : 'none' } })}
        </li>
    );
}

const ListItem = styled.li`
    font-weight: ${props => (props.isActive ? 'bold' : 'normal')};
    position: relative;
    &:before {
        content: ' ';
        position: relative;
        left: -20px;
        border-left-style: solid;
        border-left-width: 5px;
        border-left-color: ${props => (props.isActive ? props.theme.color1 : 'transparent')};
    }
    a {
        text-decoration: none;
        color: rgb(25, 25, 25);
    }
`;

export default function Menu({ items }) {
    return (
        <List style={{ marginRight: 20 }}>
            {items.map(({ title, children }) => (
                <CollapsableListItem title={title} isActive={isOpen(children)} key={title}>
                    <List>
                        {children.map(child => (
                            <ListItem isActive={isActive(child.href)} key={child.href}>
                                <StyledLink to={child.href}>{child.title}</StyledLink>
                            </ListItem>
                        ))}
                    </List>
                </CollapsableListItem>
            ))}
        </List>
    );
}
