# Frontend Refactoring Plan

## Project Context

- Framework: React 19 + TypeScript
- Build: Vite 8
- Styling: Tailwind v4 + CVA (class-variance-authority)
- Routing: TanStack Router (single route tree at `src/router/routeTree.tsx`)
- Data fetching: TanStack Query (hooks in `src/api/`)
- Source root: `src/`
- Domain types: `src/domain/plants/`
- Shared UI components: `src/ui/components/`
- Pages: `src/ui/pages/`
- Custom hooks: `src/hooks/`
- API layer (query/mutation hooks): `src/api/`
- Shared CVA definitions: `src/ui/classVariants/`
- Utility functions: `src/utils/`
- Auth: `src/auth/`

## Codebase Conventions

- All UI strings are in Spanish (hardcoded, no i18n system).
- Domain enums use `createEnumWithMeta()` from `src/domain/utils/create-enum-with-meta.ts` producing `{ values, meta, options }` objects.
- Dialogs use native `<dialog>` elements wrapped by `useDialog` hook from `src/hooks/use-dialog.ts`.
- API hooks use `@tanstack/react-query` with `toDomain` mappers that convert snake_case API responses to camelCase domain types.
- The `useImageUploads` hook in `src/api/uploads.ts` is an exception: it uses raw `fetch` instead of the shared API client.
- No test files exist in the project.
- Lint/typecheck: run `npx eslint .` and `npx tsc --noEmit` from the `frontend/` directory.

---

## Phase 1: Critical Bug Fixes

### 1.1 Fix `src/hooks/use-month-selector.ts`

**Bug A (line 24):** `setPreviousMonth` increments year instead of decrementing.

Current code at line 24:
```typescript
setYear((y) => y + 1)
```
Change to:
```typescript
setYear((y) => y - 1)
```

**Bug B (line 32):** `handleInputMonthChange` sets 1-indexed month into 0-indexed state.

Current code at line 32:
```typescript
setMonthIndex(Number(mm))
```
Change to:
```typescript
setMonthIndex(Number(mm) - 1)
```

Also add `useCallback` wrapping for `setNextMonth` and `setPreviousMonth`:
```typescript
import { useState, useCallback, type ChangeEventHandler } from 'react'

// inside the hook:
const setNextMonth = useCallback(() => {
  if (monthIndex === 11) {
    setMonthIndex(0)
    setYear((y) => y + 1)
  } else {
    setMonthIndex((state) => state + 1)
  }
}, [monthIndex])

const setPreviousMonth = useCallback(() => {
  if (monthIndex === 0) {
    setMonthIndex(11)
    setYear((y) => y - 1)
  } else {
    setMonthIndex((state) => state - 1)
  }
}, [monthIndex])

const handleInputMonthChange: ChangeEventHandler<HTMLInputElement> = useCallback((ev) => {
  const [yyyy, mm] = ev.currentTarget.value.split('-')
  setMonthIndex(Number(mm) - 1)
  setYear(Number(yyyy))
}, [])
```

### 1.2 Fix null dereference in `src/ui/components/WateringList.tsx`

**Line 77:** `p.images[0].filepath` crashes when a plant has no images.

Current code:
```tsx
<img className="h-full w-20 object-cover rounded-lg" src={p.images[0].filepath} />
```
Change to:
```tsx
{p.images[0]?.filepath ? (
  <img className="h-full w-20 object-cover rounded-lg" src={p.images[0].filepath} />
) : (
  <div className="h-full w-20 rounded-lg bg-primary-light flex items-center justify-center text-xs text-neutral-default">?</div>
)}
```

---

## Phase 2: Extract Shared `useImageManager` Hook

### 2.1 Create `src/hooks/use-image-manager.ts`

This hook consolidates the duplicated image upload/preview/delete logic from three components. The implementation must handle:

- State: `imagePaths: string[]`, `previewUrls: string[]`, `deletedPaths: string[]`
- Derived: `imagesCount`, `allowUploads`, `maxImages` (default 3)
- Refs: `deleteTargetImagePath`, `deleteImageDialogRef`
- Cleanup effect: revoke all blob URLs on unmount (fix the stale closure bug by using a ref to track current previewUrls)
- Upload handler: accepts files, creates preview URLs, uploads via `useImageUploads`, moves paths from preview to committed on success
- Delete request handler: stores target path in ref, shows confirm dialog
- Delete confirm handler: moves path from imagePaths to deletedPaths, closes dialog
- Commit deletions function: calls `deleteImage` for all deletedPaths, clears deletedPaths state
- Expose: `{ imagePaths, previewUrls, allowUploads, handleImageUpload, handleRequestDelete, handleConfirmDelete, commitDeletions, deleteDialogRef, isUploading }`

Signature:
```typescript
interface UseImageManagerParams {
  defaultImagePaths?: string[]
  maxImages?: number
}

function useImageManager(params?: UseImageManagerParams): UseImageManagerReturn
```

The `useImageUploads` call should come from `src/api/uploads.ts`. The `useDialog` call should come from `src/hooks/use-dialog.ts`.

**Critical detail for the cleanup effect:** The stale closure bug exists in all three current implementations. Use a ref to track previewUrls:

```typescript
const previewUrlsRef = useRef(previewUrls)
previewUrlsRef.current = previewUrls

useEffect(() => {
  return () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
  }
}, [])
```

### 2.2 Refactor `src/ui/components/PlantForm.tsx`

Remove the following from the component body (they move to `useImageManager`):
- `useState` for `imagePaths`, `previewUrls`, `deletedPaths` (lines 67-71)
- `useRef` for `deleteImageDialogRef`, `deleteTargetImagePath` (lines 73, 78)
- `useDialog` for delete confirmation (lines 74-76)
- `useEffect` for revoking blob URLs (lines 84-87)
- `maxImages`, `imagesCount`, `allowUploads` calculations (lines 80-82)
- `handleImageUpload` function (lines 139-166)
- `handleRequestDeleteImage` function (lines 168-171)
- `handleConfirmDeleteImage` function (lines 173-178)
- `useImageUploads` import and call (lines 16, 64)
- The delete confirmation `<dialog>` JSX (lines 410-437)

Replace with:
```typescript
const {
  imagePaths, previewUrls, allowUploads,
  handleImageUpload, handleRequestDelete, handleConfirmDelete,
  deleteDialogRef, isUploading: imageUploading,
} = useImageManager({
  defaultImagePaths: plant?.images.map(({ filepath }) => filepath),
})
```

The `submit` function's `deletedPaths` deletion logic (line 120) should call `commitDeletions()` from the hook.

Also remove the duplicate `inputVariants` definition (lines 22-44) and import from the shared location:
```typescript
import { inputVariants } from '@/ui/classVariants/input'
```

### 2.3 Refactor `src/ui/components/PlantDetails.tsx`

Remove:
- `useState` for `images`, `editingImages`, `uploading` (lines 26-28)
- `useImageUploads` import and call (lines 9, 29)
- `handleDeleteImage` function (lines 32-38)
- `handleAddImage` function (lines 41-56)

Replace with `useImageManager` initialized with `plant.images.map(i => i.filepath)`. The component only needs a subset of the hook's API (add, delete, image list). Adapt accordingly.

The image editing UI (lines 186-253) should use `imagePaths`, `handleRequestDelete`, `handleImageUpload` from the hook.

### 2.4 Refactor `src/ui/components/ImageUploader.tsx`

This component currently has its own `useImageSource`-equivalent camera/gallery dialog (lines 110-122, 138-144, 202-231) plus the source selector `<dialog>` inline. After the `useImageManager` extraction, this component should:

1. Use `useImageManager` for all image state management.
2. Keep its own camera/gallery source dialog (it's specific to this component's UI) OR use `useImageSource` from `src/hooks/use-image-source.tsx` once that hook is cleaned up (see Phase 4).
3. Remove `useImperativeHandle` (lines 56-66). The parent should call `commitDeletions()` via the hook directly, or the component should accept an `onCommit` callback. The current `getDeletedPaths` / `commitDeletions` imperative API leaks internal state.

Replace the `forwardRef` pattern with a standard component that exposes the commit function via a callback prop:
```typescript
interface ImageUploaderProps {
  defaultImagePaths?: string[]
  inputName?: string
  maxImages?: number
  onUploading?: () => void
  onUploaded?: () => void
  onCommitted?: () => void
}
```

---

## Phase 3: Fix `use-dialog.ts` Hook

### 3.1 Fix registry cleanup (`src/hooks/use-dialog.ts`)

The `useEffect` at lines 45-53 registers `onClose` into the global `registry` but never cleans up on unmount. Add cleanup:

```typescript
useEffect(() => {
  if (!dialogRef.current) return

  if (onClose) {
    registry[dialogRef.current.id] = onClose
  }

  return () => {
    if (dialogRef.current) {
      delete registry[dialogRef.current.id]
    }
  }
}, [dialogRef, onClose])
```

Note: Remove `dialogRef` from the dependency array since `RefObject` is stable across renders and including it is unnecessary noise.

### 3.2 Memoize `show()` and `close()` with `useCallback`

```typescript
import { useEffect, useId, useCallback, type RefObject } from 'react'

// inside the hook:
const show = useCallback(() => {
  onBeforeShow?.()
  if (dialogRef.current?.popover) {
    dialogRef.current.show()
  } else {
    dialogRef.current?.showModal()
  }
  onShow?.()
}, [dialogRef, onBeforeShow, onShow])

const close = useCallback(() => {
  onBeforeClose?.()
  dialogRef.current?.close()
}, [dialogRef, onBeforeClose])

return { show, close }
```

---

## Phase 4: Fix `use-image-source.tsx` Hook

### 4.1 Separate JSX from hook logic

The hook at `src/hooks/use-image-source.tsx` returns a `SourceDialog` ReactNode (lines 32-63). Hooks should return data/callbacks, not rendered UI.

Create a new component `src/ui/components/ImageSourceDialog.tsx`:
```typescript
interface ImageSourceDialogProps {
  dialogRef: RefObject<HTMLDialogElement | null>
  onSelectCapture: () => void
  onSelectGallery: () => void
}

export function ImageSourceDialog({ dialogRef, onSelectCapture, onSelectGallery }: ImageSourceDialogProps) {
  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      className={cn(
        'fixed text-lg bg-surface-raised gap-1 p-1',
        'min-w-screen self-end lg:max-w-xl',
        'grid grid-cols-[1fr_auto_1fr]',
        'transition-all transition-discrete',
        'h-32 -bottom-32 starting:open:-bottom-32 open:bottom-0',
        'backdrop:opacity-0'
      )}
    >
      <button type="button" onClick={onSelectCapture} className="h-full hover:bg-primary-subtle rounded-xl transition-colors font-medium">
        Cámara
      </button>
      <div className="w-1 bg-neutral-subtle/60 rounded-full h-3/4 self-center" />
      <button type="button" onClick={onSelectGallery} className="h-full hover:bg-primary-subtle rounded-xl transition-colors font-medium">
        Galería
      </button>
    </dialog>
  )
}
```

Rename `src/hooks/use-image-source.tsx` to `src/hooks/use-image-source.ts` (no longer needs `.tsx`).

Simplified hook:
```typescript
import useDialog from '@/hooks/use-dialog'
import { useRef, useCallback } from 'react'

const isCaptureSupported = typeof document !== 'undefined' && 'capture' in document.createElement('input')

export function useImageSource() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sourceSelectorDialogRef = useRef<HTMLDialogElement>(null)
  const { show: showSourceDialog } = useDialog({ dialogRef: sourceSelectorDialogRef })

  const requestSource = useCallback((capture: string | null) => {
    if (!fileInputRef.current) return
    if (capture) {
      fileInputRef.current.capture = capture
    } else {
      fileInputRef.current.removeAttribute('capture')
    }
    fileInputRef.current.click()
  }, [])

  const selectImage = isCaptureSupported ? showSourceDialog : requestSource

  return { fileInputRef, selectImage, sourceSelectorDialogRef }
}
```

### 4.2 Update consumers of `useImageSource`

Three files import `useImageSource`:
- `src/ui/components/PlantForm.tsx` (line 17)
- `src/ui/components/ImageSelector.tsx` (line 2)
- `src/ui/components/ImageUploader.tsx` (does NOT currently use it — it has its own inline camera/gallery dialog)

Each consumer currently destructures `{ fileInputRef, selectImage, SourceDialog }`. After the refactor:
1. Destructure `{ fileInputRef, selectImage, sourceSelectorDialogRef }` from the hook.
2. Render `<ImageSourceDialog dialogRef={sourceSelectorDialogRef} onSelectCapture={() => requestSource('environment')} onSelectGallery={() => requestSource(null)} />` in JSX.
3. Alternatively, add a helper to the hook: `openCamera` and `openGallery` callbacks so consumers don't need to know about `requestSource` internals.

For `ImageUploader.tsx`, replace the inline source selector dialog (lines 202-231) and the `requestSource` function (lines 110-122) with the shared `useImageSource` + `ImageSourceDialog`.

---

## Phase 5: Refactor `useImageUploads` (`src/api/uploads.ts`)

The current `useImageUploads` does not use any React primitives. It uses raw `fetch` instead of the shared `api/client.ts` wrapper (which handles `credentials: 'include'`).

Refactor into a proper TanStack Query mutation:

```typescript
import { useMutation } from '@tanstack/react-query'
import { api } from './client'

export function useImageUploads() {
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return api.upload('/api/uploads', fd) as Promise<{ filepath: string }>
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (imagepath: string) => {
      return api.delete(`/api/uploads${imagepath.replace('/uploads', '')}`)
    },
  })

  return {
    uploadImage: uploadMutation.mutateAsync,
    deleteImage: deleteMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
```

Verify `src/api/client.ts` has an `upload` method and a `delete` method. If `upload` is not present, check the existing `api.upload()` or `api.post()` for FormData support and adapt. The key requirement is that `credentials: 'include'` is sent with upload requests (the current raw `fetch` calls omit this).

---

## Phase 6: Fix Stale Closure in `useEffect` Cleanup

This bug exists in three files. The `useEffect` with `[]` deps captures the initial value of state, so `URL.revokeObjectURL` is never called for dynamically added preview URLs.

The fix is already described in Phase 2 (the `useImageManager` hook uses a ref). For files not covered by Phase 2:

### `src/ui/components/ImageSelector.tsx` (lines 14-17)

Replace:
```typescript
useEffect(() => {
  return () => URL.revokeObjectURL(previewUrl)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

With:
```typescript
const previewUrlRef = useRef(previewUrl)
previewUrlRef.current = previewUrl

useEffect(() => {
  return () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
  }
}, [])
```

---

## Phase 7: Decompose `SpeciesView.tsx` (430 lines)

This component has 10+ responsibilities. Decompose into:

### 7.1 Extract `src/hooks/use-species-submit.ts`

Move the `submitAction` async function (lines 72-135) into a hook:

```typescript
interface UseSpeciesSubmitParams {
  record: PlantSpecies
  fromPlantForm?: boolean
}

function useSpeciesSubmit({ record, fromPlantForm }: UseSpeciesSubmitParams) {
  const navigate = useNavigate()
  const createSpecies = useCreateSpecies()
  const updateSpecies = useUpdateSpecies()
  const { uploadImage } = useImageUploads()
  const [isPending, startTransition] = useTransition()

  const submitAction = async (fd: FormData) => {
    // ... existing logic from lines 73-134
  }

  return { submitAction, isPending }
}
```

### 7.2 Extract `src/components/SpeciesHeader.tsx`

Extract the action buttons section (lines 170-225): save/cancel (edit mode), clone/favorite/edit-link (view mode).

Props: `{ editMode: boolean, isPending: boolean, isDeleted: boolean, record: PlantSpecies, user: User | null, favorited: boolean, onToggleFavorite: () => void, onDelete: () => void }`

### 7.3 Extract `src/components/SpeciesPlantLinks.tsx`

Extract the linked plants section (lines 276-319).

Props: `{ recordId: number, isDeleted: boolean }`

Uses `usePlants(recordId)` internally.

### 7.4 Memoize option-map computations

Wrap lines 44-67 in `useMemo`:
```typescript
const categoriesOptions = useMemo(
  () => plantCategory.options.map((opt) => ({
    ...opt,
    selected: record.categories?.includes(opt.value) || false,
  })),
  [record.categories]
)
// Same pattern for waterProfileOptions, lightLevelOptions, soilTypeOptions, petToxicityOptions
```

### 7.5 Resulting structure

After decomposition, `SpeciesView.tsx` becomes a thin orchestrator (~100-120 lines) that:
1. Calls `useSpeciesSubmit` for submit logic
2. Renders `SpeciesHeader`
3. Renders name inputs + image grid
4. Renders `SpeciesPlantLinks` (in view mode)
5. Renders `DetailChecklist` sections (categories, water, light, soil, toxicity, notes)
6. Renders danger zone (delete button)

---

## Phase 8: Decompose `WateringHistoryGrid.tsx` (320 lines)

### 8.1 Extract `src/components/DaySummaryDialog.tsx`

Extract the day summary dialog (lines 170-240).

Props: `{ dialogRef, selectedDay, onClose, onQuickWatering, onEventSelect, isCreating, isDeleting }`

### 8.2 Extract `src/components/EventDetailsDialog.tsx`

Extract the event details dialog (lines 241-317).

Props: `{ dialogRef, selectedEntry, plant, isLoading, onClose, onDelete, isDeleting }`

### 8.3 Resulting structure

After extraction, `WateringHistoryGrid.tsx` becomes an orchestrator (~120-140 lines) that:
1. Uses `useMonthSelector` for navigation
2. Uses `usePlants` for data
3. Manages `selectedDay` and `selectedEntryId` state
4. Uses `useDialog` for both dialogs
5. Uses `useCreateEvent` / `useDeleteEvent` for mutations
6. Renders month navigation, plant grid with `PlantCalendar`, `DaySummaryDialog`, `EventDetailsDialog`

---

## Phase 9: Create Shared Loading/Error Components

### 9.1 Create `src/ui/components/QueryState.tsx`

```typescript
interface QueryStateProps {
  isLoading?: boolean
  error?: unknown
  loadingText?: string
  children: React.ReactNode
}

export function QueryState({ isLoading, error, loadingText = 'Cargando...', children }: QueryStateProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <p className="text-neutral-strong">{loadingText}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <p className="text-danger-strong">Error al cargar</p>
      </div>
    )
  }

  return <>{children}</>
}
```

### 9.2 Replace inline loading/error patterns

Update these files to use `<QueryState>`:
- `src/ui/components/PlantsList.tsx` (lines 34-45)
- `src/ui/components/WateringHistoryGrid.tsx` (lines 91-110)
- `src/ui/pages/PlantDetail.tsx` (lines 12-28)
- `src/ui/pages/CatalogDetail.tsx` (lines 12-28)
- `src/ui/pages/CatalogList.tsx`
- `src/ui/pages/Explore.tsx`

Note: Some pages have custom error UI (e.g., "Planta no encontrada" with a back button). For those, use only the `isLoading` prop from `QueryState` and keep the custom error UI inline.

---

## Phase 10: Filesystem Naming Fixes

### 10.1 Rename `src/ui/components/PlantsList.tsx` to `src/ui/components/PlantGrid.tsx`

This avoids the naming collision with `src/ui/pages/PlantsList.tsx`. The component is a grid display, not a list page. Update the default export name to `PlantGrid` and update the import in `src/ui/pages/PlantsList.tsx`.

### 10.2 Rename `src/ui/components/DetailLstItem.tsx` to `src/ui/components/DetailListItem.tsx`

Fix the abbreviation. Update the import in `src/ui/components/SpeciesView.tsx` (line 3).

### 10.3 Remove or gate `src/ui/pages/Sbx.tsx`

Delete the file and remove the `/sbx` route from `src/router/routeTree.tsx`. This is a development sandbox that should not exist in the codebase.

### 10.4 Remove empty interface in `src/ui/components/WateringList.tsx`

Delete lines 8-10:
```typescript
export interface WateringListProps {}
```

Change line 10 from:
```typescript
export default function WateringList(_props: WateringListProps) {
```
To:
```typescript
export default function WateringList() {
```

### 10.5 Type `emptySpecies` in `src/ui/pages/CatalogNew.tsx`

Add type annotation:
```typescript
import type { PlantSpecies } from '@/domain/plants/plant-species'

const emptySpecies: PlantSpecies = {
  // ... existing fields
}
```

If `PlantSpecies` has required fields not present in the object, add them with appropriate default values.

### 10.6 Fix `src/ui/components/PlantDetails.tsx:25` sentinel value

Change:
```typescript
const [editingField, setEditingField] = useState<'' | 'nickname' | 'acquiredAt' | 'notes'>('')
```
To:
```typescript
const [editingField, setEditingField] = useState<'nickname' | 'acquiredAt' | 'notes' | null>(null)
```

Update all `setEditingField('')` calls to `setEditingField(null)` and all `editingField !== 'nickname'` checks to `editingField !== 'nickname'` (these stay the same, but `editingField === null` is the "not editing" check).

---

## Phase 11: Additional Improvements

### 11.1 Add `useMemo` to `src/ui/components/PlantsList.tsx`

Wrap the `plantsColumns` computation (lines 16-28) and `allSpecies` derivation (lines 30-32) in `useMemo`:

```typescript
const plantsColumns: PlantsColumnsData = useMemo(() =>
  fullsearchPlants(searchTerm, plants || [])
    .filter((plant) => !selectedSpeciesId || String(plant.species.id) === selectedSpeciesId)
    .reduce(
      (cols, plant, i) => { cols[i % 2].push(plant); return cols },
      [[], []] as PlantsColumnsData
    ) || [[], []],
  [searchTerm, plants, selectedSpeciesId]
)

const allSpecies = useMemo(() =>
  (plants || [])
    .flatMap((plant) => plant.species)
    .filter((sp, i, arr) => arr.findIndex((other) => sp.id === other.id) === i),
  [plants]
)
```

### 11.2 Extract `formatWateredDate` from `src/ui/components/WateringList.tsx`

Move `formatWateredDate` (lines 36-50) to `src/utils/dates.ts` as a named export:

```typescript
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`

  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
```

Import in `WateringList.tsx`:
```typescript
import { formatRelativeDate } from '@/utils/dates'
```

### 11.3 Extract `src/components/PlantImageGallery.tsx` from `PlantDetails.tsx`

The image grid editing section (lines 186-253) is self-contained UI with its own state (`editingImages`, `uploading`). Extract it:

```typescript
interface PlantImageGalleryProps {
  images: PlantWithSpecies['images']
  plantId: number
  onAddImage: (file: File) => void
  onDeleteImage: (filepath: string) => void
  uploading: boolean
}
```

### 11.4 Extract `src/components/LocationChangeDialog.tsx` from `PlantDetails.tsx`

The location change dialog (lines 265-337) with its form is self-contained. The `handleLocationChangeDialogClose` handler (lines 58-107) moves with it. Extract into a component that accepts `onSubmit: (data: { location, date, notes }) => Promise<void>`.

---

## Execution Order Summary

1. Phase 1: Bug fixes (use-month-selector.ts, WateringList.tsx null deref)
2. Phase 2: Create useImageManager hook, refactor PlantForm, PlantDetails, ImageUploader
3. Phase 3: Fix use-dialog.ts (cleanup, memoize)
4. Phase 4: Refactor use-image-source hook, create ImageSourceDialog component, update consumers
5. Phase 5: Refactor useImageUploads to use React Query + api client
6. Phase 6: Fix stale closure in ImageSelector.tsx
7. Phase 7: Decompose SpeciesView.tsx
8. Phase 8: Decompose WateringHistoryGrid.tsx
9. Phase 9: Create QueryState component, replace inline patterns
10. Phase 10: Filesystem naming fixes
11. Phase 11: Additional improvements (useMemo, utility extraction, sub-components)

## Verification

After each phase, run:
```bash
cd frontend && npx tsc --noEmit && npx eslint .
```

This ensures no type errors or lint violations are introduced. Since there are no tests, type checking and linting are the primary verification mechanisms.
