import Image from "next/image";
import Dashboard_home from "./components/dashboard_home";
import Head from "next/head";


export default function Home() {
  return (
    <Head>
      
    
    <div className="font-sans grid grid-rows-[20px_1fr_20px]  min-h-screen p-8 pb-20 gap-16 sm:p-20">
      
          <Dashboard_home></Dashboard_home>
    </div>
    </Head>
  );
}
