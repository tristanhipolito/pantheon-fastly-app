"use client";

// import AuthWrapper from "../components/AuthWrapper";
import Services from "../components/services";
import Header from "../components/header";

export default function Home() {
  return (
    // <AuthWrapper>
      <div className="min-h-screen bg-gray-50 p-8">
        <Header />
        <main className="max-w-4xl mx-auto">
          <Services />
        </main>
      </div>
    // </AuthWrapper>
  );
}