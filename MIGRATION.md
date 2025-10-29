# Migration Plan: React Beautiful DnD to @dnd-kit

## Context

React Beautiful DnD is no longer actively maintained and has been deprecated. The library shows warnings in the console and may have compatibility issues with future React versions.

**Current Usage:**
- `src/components/TaskList.tsx` - Drag and drop for task reordering
- `src/components/TaskItem.tsx` - Individual draggable task items
- `src/pages/Routines.tsx` - (if any drag/drop for routines)

## Recommended Replacement: @dnd-kit

[@dnd-kit](https://dndkit.com/) is the modern, actively maintained successor with better TypeScript support, accessibility, and performance.

### Migration Benefits:
- ✅ Active maintenance and React 18+ support
- ✅ Better TypeScript types
- ✅ Improved accessibility (keyboard navigation, screen readers)
- ✅ Smaller bundle size
- ✅ More flexible API
- ✅ Better mobile support

## Migration Steps

### Phase 1: Install Dependencies
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm uninstall react-beautiful-dnd @types/react-beautiful-dnd
```

### Phase 2: Update TaskList.tsx

**Before (react-beautiful-dnd):**
```tsx
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="tasks">
    {(provided) => (
      <div ref={provided.innerRef} {...provided.droppableProps}>
        {tasks.map((task, index) => (
          <Draggable key={task.id} draggableId={task.id} index={index}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.draggableProps}>
                <div {...provided.dragHandleProps}>
                  <GripVertical />
                </div>
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>
```

**After (@dnd-kit):**
```tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
);

<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={tasks.map(t => t.id)}
    strategy={verticalListSortingStrategy}
  >
    {tasks.map((task) => (
      <SortableTaskItem key={task.id} task={task} />
    ))}
  </SortableContext>
</DndContext>
```

### Phase 3: Update TaskItem.tsx

**After (@dnd-kit):**
```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TaskItem = ({ task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div {...listeners}>
        <GripVertical />
      </div>
      {/* Task content */}
    </div>
  );
};
```

### Phase 4: Update handleDragEnd Logic

**Before:**
```tsx
const handleDragEnd = (result: any) => {
  if (!result.destination) return;
  const items = Array.from(localTasks);
  const [reorderedItem] = items.splice(result.source.index, 1);
  items.splice(result.destination.index, 0, reorderedItem);
  setLocalTasks(items);
};
```

**After:**
```tsx
import { arrayMove } from '@dnd-kit/sortable';

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  
  if (!over || active.id === over.id) return;
  
  setLocalTasks((items) => {
    const oldIndex = items.findIndex(t => t.id === active.id);
    const newIndex = items.findIndex(t => t.id === over.id);
    return arrayMove(items, oldIndex, newIndex);
  });
};
```

## Testing Checklist

- [ ] Tasks can be dragged and dropped
- [ ] Visual feedback during drag (opacity, scale)
- [ ] Keyboard navigation works (Tab, Space, Arrow keys)
- [ ] Touch/mobile drag works
- [ ] Position persists after drag
- [ ] No console warnings
- [ ] Accessibility audit passes

## Estimated Effort

- **Time:** 2-3 hours
- **Risk:** Low (well-documented migration path)
- **Priority:** Medium (works currently, but should migrate before React 19)

## Resources

- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [Migration Guide from react-beautiful-dnd](https://docs.dndkit.com/guides/migration/react-beautiful-dnd)
- [Examples](https://master--5fc05e08a4a65d0021ae0bf2.chromatic.com/)

## Notes

- This is **not urgent** - current implementation works fine
- Schedule during low-traffic period or feature freeze
- Consider adding this to next sprint planning
- Can be done incrementally (one component at a time)
