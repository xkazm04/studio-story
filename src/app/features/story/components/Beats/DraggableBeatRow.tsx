'use client';

import { Draggable } from '@hello-pangea/dnd';
import BeatsTableRow from './BeatsTableRow';
import { BeatTableItem } from './BeatsOverview';
import { GripVertical } from 'lucide-react';
import { INTERACTIVE } from '@/workspace/theme/tokens';

type Props = {
    beat: BeatTableItem;
    index: number;
    setBeats: React.Dispatch<React.SetStateAction<BeatTableItem[]>>;
};

const DraggableBeatRow = ({ beat, index, setBeats }: Props) => {
    return (
        <Draggable draggableId={beat.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`
                        flex py-2 px-3 border-b border-slate-800 text-sm transition-all duration-200
                        ${snapshot.isDragging ? INTERACTIVE.dragActive : INTERACTIVE.row}
                    `}
                    style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 1 : snapshot.isDropAnimating ? 1 : undefined,
                    }}
                    data-testid={`beat-row-${beat.id}`}
                >
                    {/* Drag Handle */}
                    <div
                        {...provided.dragHandleProps}
                        role="button"
                        aria-label={`Drag beat ${beat.name}`}
                        className={`
                            flex items-center justify-center pr-2 cursor-grab active:cursor-grabbing
                            ${snapshot.isDragging ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}
                        `}
                        data-testid={`beat-drag-handle-${beat.id}`}
                    >
                        <GripVertical className="h-4 w-4" />
                    </div>

                    {/* Beat Content - use a wrapper div to properly position content */}
                    <div className="flex-1 flex items-center">
                        <BeatsTableRow
                            beat={beat}
                            index={index}
                            setBeats={setBeats}
                        />
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default DraggableBeatRow;
