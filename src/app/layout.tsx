import './globals.css';
import type { Metadata } from 'next';
export const metadata:Metadata={title:'Kanban Studio — Work, in flow',description:'A focused workspace to plan, organize and ship meaningful work.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
