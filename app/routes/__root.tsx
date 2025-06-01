import * as React from 'react'
import {
    Outlet,
    createRootRoute,
    HeadContent,
    Scripts,
} from '@tanstack/react-router'
import { seo } from '../../utils/seo'
import '../global.css'

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {
                charSet: 'utf-8',
            },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1',
            },
            ...seo({
                title:
                    'Redis Watch',
                description: 'Visually manage your Redis instances',

            }),
        ],
        links: [
            {
                rel: 'preconnect',
                href: 'https://fonts.googleapis.com',
            },
            {
                rel: 'preconnect',
                href: 'https://fonts.gstatic.com',
                crossOrigin: 'anonymous',
            },
            {
                href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@500;600;700;800&display=swap',
                rel: 'stylesheet',
            },
        ],
    }),
    component: RootComponent,
})

function RootComponent() {
    return React.createElement(
        RootDocument,
        null,
        React.createElement(Outlet)
    )
}

function RootDocument({ children }: Readonly<{ children: React.ReactNode }>) {
    return React.createElement(
        "html",
        { lang: "en" },
        React.createElement(
            "head",
            null,
            React.createElement(HeadContent)
        ),
        React.createElement(
            "body",
            { className: "min-h-screen" },
            children,
            React.createElement(Scripts)
        )
    )
}
