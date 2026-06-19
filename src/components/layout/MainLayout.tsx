import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen min-w-[1280px] bg-[#f7f0ff]">
      <Sidebar />
      <main className="ml-[232px] h-screen w-[calc(100vw-232px)] min-w-[1048px] overflow-auto p-8">
        <div className="mx-auto w-full max-w-[1120px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
