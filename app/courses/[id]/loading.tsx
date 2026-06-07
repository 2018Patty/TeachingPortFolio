import React from 'react';

export default function CourseDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Navbar skeleton */}
      <nav className="w-full bg-white border-b border-slate-100 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-200 animate-pulse shrink-0"></div>
            <div className="space-y-1">
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-3 w-20 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-9 w-28 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
      </nav>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow space-y-8 w-full">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-60 bg-slate-200 rounded animate-pulse"></div>

        {/* Hero Course Header skeleton */}
        <div className="bg-gradient-to-tr from-slate-100 to-slate-200 rounded-[2.5rem] p-6 sm:p-10 shadow border border-slate-200 space-y-4">
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-slate-300 rounded-full animate-pulse"></div>
            <div className="h-6 w-20 bg-slate-300 rounded-full animate-pulse"></div>
          </div>
          <div className="h-12 w-1/3 bg-slate-300 rounded-xl animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-6 w-1/2 bg-slate-250 rounded animate-pulse"></div>
            <div className="h-4 w-1/3 bg-slate-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-2xl border-t border-slate-200">
            <div className="h-14 bg-slate-200 rounded-2xl animate-pulse"></div>
            <div className="h-14 bg-slate-200 rounded-2xl animate-pulse"></div>
            <div className="h-14 bg-slate-200 rounded-2xl animate-pulse"></div>
          </div>
        </div>

        {/* Dynamic Detail grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Description skeleton */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 space-y-4">
              <div className="h-6 w-44 bg-slate-200 rounded animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Objectives skeleton */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 space-y-4">
              <div className="h-6 w-48 bg-slate-200 rounded animate-pulse"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-200 animate-pulse"></div>
                    <div className="h-4 w-11/12 bg-slate-100 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-100 border border-slate-200 rounded-[2rem] p-6 sm:p-8 space-y-4">
              <div className="h-4 w-32 bg-slate-300 rounded animate-pulse"></div>
              <div className="h-3 w-48 bg-slate-200 rounded animate-pulse"></div>
              <div className="space-y-2 pt-2">
                <div className="h-14 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
                <div className="h-14 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse"></div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-16 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-slate-300 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded animate-pulse"></div>
              <div className="h-10 bg-slate-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
