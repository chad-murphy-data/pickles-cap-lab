// One computed pick can wait here; the visible draft advances only on reveal.
// Injected timers let tests verify pacing without a browser or real waits.
export function createRevealQueue({onReveal, interval = 250, now = () => performance.now(), setTimer = setTimeout, clearTimer = clearTimeout}) {
  let pending = null, timer = null, paused = false, lastReveal = now(), epoch = 0;
  function clear() {if (timer !== null) clearTimer(timer); timer = null;}
  function schedule() {
    clear();
    if (paused || pending === null) return;
    const token = epoch;
    timer = setTimer(() => {
      timer = null;
      if (token !== epoch || paused || pending === null) return;
      const value = pending; pending = null; lastReveal = now(); onReveal(value);
    }, Math.max(0, interval - (now() - lastReveal)));
  }
  return {
    offer(value) {pending = value; schedule();},
    markReveal() {lastReveal = now();},
    setPaused(value) {paused = Boolean(value); schedule();},
    setInterval(value) {if (!Number.isFinite(value) || value < 0) throw new RangeError('Reveal interval must be nonnegative.'); interval = value; schedule();},
    cancel() {epoch++; clear(); pending = null; paused = false; lastReveal = now();},
  };
}
