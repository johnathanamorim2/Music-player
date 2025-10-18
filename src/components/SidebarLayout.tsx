import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MadeWithDyad } from "./made-with-dyad";

export const SidebarLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />
      
      {/* Conteúdo principal, com padding à esquerda para compensar a sidebar */}
      <div className="flex-1 md:ml-64 flex flex-col">
        <main className="flex-1">
          <Outlet />
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};