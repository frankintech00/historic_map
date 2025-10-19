import React from "react";
import SearchBar from "../controls/SearchBar";

/**
 * Transparent header — only the search box visible and centred at the top.
 */
export default function Header() {
  return (
    <div
      className="
        fixed top-3 left-0 right-0 z-[1100]
        flex justify-center
        pointer-events-none
      "
    >
      <div className="pointer-events-auto w-full max-w-2xl px-3">
        <SearchBar />
      </div>
    </div>
  );
}
