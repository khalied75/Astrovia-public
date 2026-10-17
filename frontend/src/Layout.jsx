import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="overflow-hidden [background-image:linear-gradient(#ffffff03_1px,transparent_1px),linear-gradient(90deg,#ffffff03_1px,transparent_1px)] [background-size:80px_80px]">
      <a
        className="fixed -top-20 left-5 z-50 bg-white p-4 text-black focus:top-3"
        href="#main-content"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
