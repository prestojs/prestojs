import React, { useState } from 'react';
import { Link } from 'gatsby';
import styled from 'styled-components';

const List = styled.ul``;

const isActive = href => typeof window !== `undefined` && window.location.pathname.startsWith(href);

const isOpen = children => {
    for (const child of children) {
        if (isActive(child.href)) {
            return true;
        }
    }
    return false;
};

function CollapsableListItem({ title, children, isActive }) {
    const [isOpen, setIsOpen] = useState(isActive);

    return (
        <li>
            {isActive ? <strong>{title}</strong> : title}{' '}
            <button onClick={() => setIsOpen(open => !open)}>^</button>
            {isOpen && children}
        </li>
    );
}

const ListItem = styled.li`
    font-weight: ${props => (props.isActive ? 'bold' : 'normal')};
    border-right-style: solid;
    border-right-width: 5px;
    border-right-color: ${props => (props.isActive ? '#282c34' : 'transparent')};
    a {
        text-decoration: none;
    }
`;

export default function Menu({ items }) {
    return (
        <List>
            {items.map(({ title, children }) => (
                <CollapsableListItem title={title} isActive={isOpen(children)}>
                    <ul>
                        {children.map(child => (
                            <ListItem isActive={isActive(child.href)}>
                                <Link to={child.href}>{child.title}</Link>
                            </ListItem>
                        ))}
                    </ul>
                </CollapsableListItem>
            ))}
        </List>
    );
}
