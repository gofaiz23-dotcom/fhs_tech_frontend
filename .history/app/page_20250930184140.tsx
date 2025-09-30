import Image from "next/image";
import Dashboard_home from "./components/dashboard_home";
import Head from "next/head";
import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px]  min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <Navbar />
      <Dashboard_home />
    </div>
  );
}
