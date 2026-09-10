// Keep the latest result ready without removing a marker someone is reading.
export function createPopupSafeRefresh(isPopupOpen, apply) {
  let pending = null;
  return {
    update(value) {
      pending = value;
      this.flush();
    },
    flush() {
      if (pending === null || isPopupOpen()) return;
      const value = pending;
      pending = null;
      apply(value);
    },
    clear() {
      pending = null;
    },
  };
}
