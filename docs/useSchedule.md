# `useSchedule.ts` — Code Documentation

**File:** `frontend/src/hooks/useSchedule.ts`  
**Type:** Custom React Hook  
**Language:** TypeScript

---

## What It Does

`useSchedule` is a custom React hook that manages the **complete lifecycle of a train schedule** — from fetching the AI-computed result, through controller override, to final confirmation.

It encapsulates all API calls and state transitions so that UI components stay clean and focused only on rendering.

---

## State Machine

The hook drives a linear state machine with 6 possible states:

```
idle
 │
 ▼ runScheduler()
loading
 │
 ▼ (success)
computed ──────────────────────────────────────┐
 │                                             │
 ├── applyOverride(ids[])                      │
 │     │                                       │
 │     ▼ overriding                            │
 │     └── (success) → computed (isOverridden) │
 │                                             │
 ├── cancelOverride()                          │
 │     └── calls DELETE /override → runScheduler() again
 │                                             │
 └── confirmSchedule()                         │
       └── (success) → confirmed               │
                                               │
 Any step on failure → error ─────────────────┘
```

---

## State Variables

| Variable | Type | Description |
|---|---|---|
| `schedule` | `ScheduleResult \| null` | The current schedule returned by the backend |
| `status` | `ScheduleStatus` | Current phase of the lifecycle (see state machine above) |
| `error` | `string \| null` | Error message from the last failed API call |
| `isOverridden` | `boolean` | `true` if the displayed schedule came from a controller override, `false` if AI-generated |

---

## Exposed Actions

| Function | API Call | Description |
|---|---|---|
| `runScheduler()` | `GET /schedule` | Fetches the AI-computed passing order |
| `applyOverride(ids[])` | `POST /schedule/override` | Sends a manually reordered list of train IDs; backend recomputes schedule using that order |
| `cancelOverride()` | `DELETE /schedule/override` + re-run | Cancels the override and reverts to the fresh AI schedule |
| `confirmSchedule()` | `POST /schedule/confirm` | Controller formally approves the current schedule |
| `reset()` | *(no API call)* | Clears all state back to `idle` |

---

## Code Walkthrough

```ts
// 1. Fetch AI schedule
const runScheduler = useCallback(async () => {
  setStatus('loading');
  const result = await api.getSchedule();   // GET /schedule
  setSchedule(result);
  setIsOverridden(false);
  setStatus('computed');
}, []);

// 2. Apply a manual reorder from the controller
const applyOverride = useCallback(async (orderedIds: string[]) => {
  setStatus('overriding');
  const result = await api.overrideSchedule({ ordered_train_ids: orderedIds }); // POST /schedule/override
  setSchedule(result);
  setIsOverridden(true);   // flag that this came from the controller
  setStatus('computed');
}, []);

// 3. Cancel override → revert to AI
const cancelOverride = useCallback(async () => {
  await api.cancelOverride();   // DELETE /schedule/override
  setIsOverridden(false);
  await runScheduler();         // fresh AI result
}, [runScheduler]);

// 4. Controller confirms the current schedule
const confirmSchedule = useCallback(async () => {
  await api.confirmSchedule();  // POST /schedule/confirm
  setStatus('confirmed');
}, []);

// 5. Reset everything
const reset = useCallback(() => {
  setSchedule(null);
  setStatus('idle');
  setError(null);
  setIsOverridden(false);
}, []);
```

---

## Why It's Designed This Way

- **Single source of truth** — all schedule state lives here; components only read and call actions
- **`useCallback`** — prevents unnecessary re-renders by keeping function references stable
- **`isOverridden` flag** — lets the UI show "Override Active" badge without inspecting schedule data
- **Error isolation** — each action catches its own errors so a failed confirm doesn't wipe out the displayed schedule
- **No Redux needed** — lifted state in a hook is sufficient for MVP-scale complexity

---

## Usage in `App.tsx`

```tsx
const {
  schedule, status, error, isOverridden,
  runScheduler, applyOverride, cancelOverride,
  confirmSchedule, reset,
} = useSchedule();
```
