import React from 'react';

export default function Loading() {
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

      {/* Hero skeleton */}
      <div className="bg-gradient-to-r from-slate-100 to-slate-200/80 py-12 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl w-full">
            <div className="h-6 w-36 bg-slate-200/80 rounded-full animate-pulse"></div>
            <div className="h-10 w-3/4 bg-slate-300/65 rounded-xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-200/85 rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-slate-200/85 rounded animate-pulse"></div>
              <div className="h-4 w-2/3 bg-slate-200/85 rounded animate-pulse"></div>
            </div>
            <div className="pt-2">
              <div className="h-10 w-44 bg-slate-300 rounded-xl animate-pulse"></div>
            </div>
          </div>
          <div className="bg-white/80 border border-slate-200/60 rounded-3xl p-6 w-full max-w-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 animate-pulse"></div>
              <div className="space-y-1.5 w-1/2">
                <div className="h-3 w-12 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 w-28 bg-slate-300 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3.5 grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="h-3 w-16 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-5 w-12 bg-slate-300 rounded animate-pulse"></div>
              </div>
              <div className="space-y-1">
                <div className="h-3 w-16 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-5 w-12 bg-slate-300 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton with Selector and Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow space-y-8 w-full">
        {/* Selector placeholder */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-[2rem] border border-slate-200/60 shadow-sm animate-pulse">
          <div className="h-6 w-48 bg-slate-200 rounded"></div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="h-10 w-28 bg-slate-200 rounded-xl"></div>
            <div className="h-10 w-28 bg-slate-200 rounded-xl"></div>
          </div>
        </div>

        {/* Product/Course grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((key) => (
            <div key={key} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse"></div>
                <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse"></div>
              </div>

              <div className="space-y-2">
                <div className="h-7 w-3/4 bg-slate-200 rounded-xl animate-pulse"></div>
                <div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse"></div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="h-4 w-16 bg-slate-100 rounded animate-pulse"></div>
                <div className="h-9 w-24 bg-slate-200 rounded-xl animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
