import type { ReactNode } from 'react'
import {
    Outlet,
    createRootRoute,
    HeadContent,
    Scripts,
} from '@tanstack/react-router'
import css from '../global.css?url'
import { seo } from '../../utils/seo'

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
            { rel: 'stylesheet', href: css },
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
    return (
        <RootDocument>
            <Outlet />
        </RootDocument>
    )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body className="min-h-screen">
                {children}
                <Scripts />
            </body>
        </html>
    )
}
