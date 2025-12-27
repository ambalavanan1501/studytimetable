import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableWidgetProps {
    id: string;
    children: React.ReactNode;
}

export function SortableWidget({ id, children }: SortableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id, resizeObserverConfig: { disabled: true } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: 'none' // Prevent scrolling while dragging (optional, depends on UX)
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none h-full">
            {children}
        </div>
    );
}
