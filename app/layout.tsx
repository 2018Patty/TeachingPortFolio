/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface CustomMetadata {
  title: string;
  description: string;
}

export const metadata: CustomMetadata = {
  title: 'ระบบเว็บไซต์แสดงคอร์สที่สอน | ผศ.ดร.ภัทราพร วรินทรเวช',
  description: 'Teaching Course Portfolio - Faculty Course Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <meta charSet="UTF-8" />
        {/* Google Fonts link for Plus Jakarta Sans, Anuphan, and Fallbacks for Google Sans look */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        {/* Fallback to styled Google Sans local font declaration in globals.css */}
      </head>
      <body className="font-sans antialiased bg-slate-50 text-slate-800 min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            /* 4 Pastel colors + text colors specified in WCAG 2.1 AA standards */
            --pastel-blue-bg: #DBEAFE;
            --pastel-blue-text: #1D4ED8;
            
            --pastel-pink-bg: #FCE7F3;
            --pastel-pink-text: #9D174D;
            
            --pastel-green-bg: #DCFCE7;
            --pastel-green-text: #15803D;
            
            --pastel-purple-bg: #F3E8FF;
            --pastel-purple-text: #7E22CE;
            
            /* Accent Indigo CTA */
            --accent-indigo: #4F46E5;
            --accent-indigo-hover: #4338CA;
          }
        ` }} />
        {children}
      </body>
    </html>
  );
}
