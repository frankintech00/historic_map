import React, { useState } from "react";
import Header from "./components/layout/Header.jsx";
import MapView from "./components/maps/MapView.jsx";
import { SearchProvider } from "./state/SearchBus.jsx";

export default function App() {
  // Store latest "go to" payload from the search bar
  const [gotoPayload, setGotoPayload] = useState(null);

  function handleGoto(payload) {
    // Attach a nonce so identical locations still retrigger effects
    setGotoPayload({
      ...payload,
      _nonce: crypto.getRandomValues(new Uint32Array(1))[0],
    });
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Provider MUST wrap Header so SearchBar can access the context */}
      <SearchProvider onGoto={handleGoto}>
        <Header />
        <main className="flex-1 relative min-h-0">
          <MapView gotoPayload={gotoPayload} />
        </main>
      </SearchProvider>
    </div>
  );
}
