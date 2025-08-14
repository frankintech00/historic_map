import React from "react";
import SearchBar from "../controls/SearchBar.jsx";

/**
 * Header.jsx
 * Simple top bar with centred search. Room for logo/actions later.
 */
export default function Header() {
  return (
    <header className="bg-white shadow-sm z-[1000] h-16 flex items-center">
      <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-center">
        <SearchBar />
      </div>
    </header>
  );
}
