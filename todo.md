# RuuviDash — where to continue

## Now working
- Live BLE advertisement scanning on macOS via `@abandonware/noble` (Electron has BT entitlement via its Info.plist; iTerm also works for standalone scripts).
- Decoder for Ruuvi Air advertisement formats DF6 (`0x06`) + DFE1 (`0xE1`) — `src/ruuvi/decode.ts`. Auto-walks concatenated frames; prefers DFE1.
- GATT historical log fetch via Nordic UART Service — `electron/ruuvi-log-fetch.ts` + decoder in `src/ruuvi/log-decode.ts`. Fetches last 7 days (~2000 records) on first sighting of each MAC. Note VOC/NOx bit packing differs from advertisement (msb+lo-8 vs hi-8+lsb).
- Renderer store with **timestamped** samples (`src/ruuvi/store.ts`). MAC-keyed dedup, history merge with 30s ts dedup, 7-day retention. `useLiveRooms()` + `useSyncStatus()` hooks.
- Stacked per-metric chart rows (temp / humidity / co2 for AIR sensors) with auto-scaling y-axis + tiny min/max labels.
- Range pills simplified to **24h / 7d**; defaults to 7d. `sliceForRange` filters by timestamp.
- Sync indicator in WindowChrome: dot pulses + "syncing history…" while GATT fetch is in flight, "live · 1s" otherwise, "sync error" in warn color on failure.

## Critical next steps
- [ ] **Periodic re-fetch**: history is fetched once per session per MAC. If the app runs >5 min, the 7d view doesn't gain new data beyond live broadcasts appending at 1×/3s cadence. Add a periodic re-fetch (every ~5 min? or on window focus?) OR build a "sync now" button.
- [ ] **Live samples vs history time alignment**: live broadcasts append at ~3s cadence; history is sparse at 5-min cadence. On the chart, this creates a dense cluster at the rightmost edge. Consider downsampling live appends to 5-min buckets (avg/last in each bucket) so the time density is uniform — would also stabilize the auto-scale wobble.
- [ ] **Auto-scale stability**: each new live sample re-runs `Math.min/max` on the whole series, so y-bounds wobble by an LSB. Either clamp to a minimum window (e.g. min 1°C for temp) or recompute scale only on history-load / range-change.

## UX gaps
- [ ] **Settings panel**: `prefs` state (units C/F, theme, accent, density) exists in App.tsx with `void setPrefs` — wire a UI for it.
- [ ] **Persistence**: install `electron-store` (or write a small JSON file) to persist `prefs` + `selectedRoomId` across launches.
- [ ] **Sensor renaming**: room name currently comes from BLE local name (`RuuviAir 4603`). Add user-editable rename + persist.
- [ ] **Sidebar `+ Pair sensor` button** does nothing — either implement a pairing flow (auto-discovers Ruuvis, user clicks one to add) or hide.
- [ ] **Sidebar footer** (`HUB · online · 192.168.1.42`, `GATEWAY · ble · 2 dropped/24h`) is placeholder text from the design — replace with real BLE adapter info or remove.
- [ ] **Battery / FW** are placeholders. DF6/DFE1 don't carry them; would need a separate GATT read (battery service `0x180F`, firmware revision in DIS `0x180A`).
- [ ] **Sync error UX**: errors flag the WindowChrome indicator but offer no retry. Add retry-on-click or auto-retry with backoff.
- [ ] **Chart time axis**: the original design had `Mon Tue Wed…` / `00:00 04:00…` ticks at the bottom. Lost during the per-metric-row refactor. Add a time axis at the bottom of the chart card showing actual dates/hours derived from the data span.
- [ ] **VOC chart row**: currently VOC only appears in the hero stack on the right. Was removed from the chart at user request. Possibly add it back as a 4th row, or keep tile-only.

## Multi-sensor
- [ ] **Fetch queue**: scanner does single-flight history fetch (busy flag); fine for 1 sensor. For multiple Ruuvis, queue per-MAC fetches sequentially (noble can't scan + connect concurrently).
- [ ] **Verify dedup with multiple sensors**: store keys by MAC — should work, but untested.
- [ ] **Per-sensor sync indicator**: currently global. With multiple sensors, show which one is syncing.

## Code quality
- [ ] **Tests**: only `scripts/test-decode.mjs` exists (advertisement decoder). Add tests for `log-decode.ts` (`decodeLogRecord` + `LogPacketFramer` with captured byte sequences).
- [ ] **electron-builder / packaging**: no production packaging config. App only runs via `npm run dev` or `npx electron .` against `out/`.
- [ ] **Type safety**: a few `any` types in `electron/ruuvi-log-fetch.ts` (`Peripheral`, `Characteristic`) because `@abandonware/noble` has thin/missing types. Add `@types/noble` or write minimal local declarations.
- [ ] **`scripts/` org**: three .mjs scripts (`scan-ruuvi`, `fetch-history`, `test-decode`) — fine as-is, but add a `scripts/README.md` summarizing what each does and the env vars (`RUUVI_MAC`, `DAYS`, `SINCE`, `SCAN_MS`).

## Known gotchas (worth remembering)
- macOS hides BLE MACs (per-session UUID via CoreBluetooth). Our decoder extracts the real MAC from inside the DFE1 payload — we key the store on that, not on `peripheral.id`.
- `@abandonware/noble` must be in `dependencies` (not devDependencies), otherwise `externalizeDepsPlugin` bundles it and Vite eagerly resolves Linux-only `bluetooth-hci-socket` / `ws` siblings, crashing main at startup. Optional deps for `bluetooth-hci-socket` and `ws` are kept in `optionalDependencies` for Linux cross-platform.
- After installing native modules, re-run `npx electron-rebuild -f -w @abandonware/noble` to match Electron's Node ABI.
- Running plain `node …` BT scripts from Claude Code's shell hits macOS silent-deny (parent process lacks BT entitlement). Run them in iTerm. `npx electron .` from any context works because Electron.app has its own BT entitlement.
- Ruuvi Air log records use a **different** VOC/NOx packing than advertisements (msb + low-8 bits vs hi-8 + lsb). Decoders are separate; don't unify them naively.

## Spec references (already in conversation, captured here for resilience)
- Advertisement formats: <https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-6> + <https://docs.ruuvi.com/communication/bluetooth-advertisements/data-format-e1>
- GATT log fetch: <https://github.com/ruuvi/docs/blob/master/communication/bluetooth-connection/nordic-uart-service-nus/read-logged-history-ruuvi-air.md>
- Reference Python impl: <https://github.com/ttu/ruuvitag-sensor>
