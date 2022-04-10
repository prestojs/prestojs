import { PreferencesProvider } from '@prestojs/doc';
import { UiProvider } from '@prestojs/ui';
import FormItemWrapper from '@prestojs/ui-antd/FormItemWrapper';
import FormWrapper from '@prestojs/ui-antd/FormWrapper';
import { CharField, Field, viewModelFactory } from '@prestojs/viewmodel';
import Head from 'next/head';
import React, { ReactNode, useState } from 'react';
import getFormatterForField from '../getFormatterForField';
import getWidgetForField from '../getWidgetForField';
import Header from './Header';
import MainMenuSidebar from './MainMenuSidebar';

const User = viewModelFactory(
    {
        id: new Field<any>(),
        firstName: new CharField(),
    },
    { pkFieldName: 'id' }
);

function MainContent({ children }: { children: ReactNode }) {
    return (
        <div className="lg:ml-[18.5rem] main-content pb-10" id="top-of-content">
            <div className="max-w-3xl mx-auto pt-10 xl:max-w-none">{children}</div>
        </div>
    );
}

export default function Layout({ children }: { children: ReactNode }) {
    const [showMenu, setShowMenu] = useState(false);
    return (
        <PreferencesProvider>
            <Head>
                <title>Presto</title>
            </Head>
            <UiProvider
                getWidgetForField={getWidgetForField}
                getFormatterForField={getFormatterForField}
                formItemComponent={FormItemWrapper}
                formComponent={FormWrapper}
            >
                <Header onToggleMenu={() => setShowMenu(visible => !visible)} />
                <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
                    <MainMenuSidebar
                        className="w-[18.5rem] top-16 pt-10 left-[max(0px,calc(50%-48rem))]"
                        forceOpen={showMenu}
                        onCloseMenu={() => setShowMenu(false)}
                    />
                    <MainContent>{children}</MainContent>
                </div>
            </UiProvider>
        </PreferencesProvider>
    );
}
