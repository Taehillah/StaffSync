// src/components/layout/MainLayout.jsx
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="layout-shell"> 
      <Outlet />
    </div>
  );
}
