import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type ScreenReaderInstructions,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'

interface Props<T extends { id: string }> {
  elements: T[]
  rendre(e: T): ReactNode
  onDeplacer(de: number, vers: number): void
  libelle: string
}

// Textes d'accessibilité de dnd-kit, en anglais par défaut.
const consignes: ScreenReaderInstructions = {
  draggable:
    'Pour déplacer un élément, appuie sur Espace ou Entrée, utilise les flèches pour le déplacer, puis appuie de nouveau sur Espace ou Entrée pour le déposer, ou sur Échap pour annuler.',
}

const annonces: Announcements = {
  onDragStart: () => 'Élément saisi.',
  onDragOver: ({ active, over }) => (over && over.id !== active.id ? 'Élément déplacé.' : undefined),
  onDragEnd: () => 'Élément déposé.',
  onDragCancel: () => 'Déplacement annulé.',
}

function Element({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id })
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 44,
        opacity: isDragging ? 0.6 : 1,
        listStyle: 'none',
      }}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label="Déplacer"
        {...attributes}
        {...listeners}
        style={{
          minWidth: 44,
          minHeight: 44,
          background: 'transparent',
          border: 'none',
          color: 'var(--texte-2)',
          fontSize: 22,
          touchAction: 'none',
        }}
      >
        ≡
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </li>
  )
}

export function ListeReordonnable<T extends { id: string }>({ elements, rendre, onDeplacer, libelle }: Props<T>) {
  const capteurs = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function fin({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const de = elements.findIndex((e) => e.id === active.id)
    const vers = elements.findIndex((e) => e.id === over.id)
    if (de >= 0 && vers >= 0) onDeplacer(de, vers)
  }

  return (
    <DndContext
      sensors={capteurs}
      collisionDetection={closestCenter}
      onDragEnd={fin}
      accessibility={{ screenReaderInstructions: consignes, announcements: annonces }}
    >
      <SortableContext items={elements.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        <ul aria-label={libelle} style={{ margin: 0, padding: 0 }}>
          {elements.map((e) => (
            <Element key={e.id} id={e.id}>
              {rendre(e)}
            </Element>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
