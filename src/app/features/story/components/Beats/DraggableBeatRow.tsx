'use client';

import { Draggable } from '@hello-pangea/dnd';
import BeatsTableRow from './BeatsTableRow';
import { BeatTableItem } from './BeatsOverview';
import { GripVertical } from 'lucide-react';

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
                        flex py-2 px-3 border-b border-gray-800 text-sm
                        ${snapshot.isDragging ? 'bg-gray-800 shadow-lg shadow-blue-500/20 border-blue-500/50' : 'hover:bg-gray-900/50'}
                        transition-colors duration-200
                    `}
                    data-testid={`beat-row-${beat.id}`}
                >
                    {/* Drag Handle */}
                    <div
                        {...provided.dragHandleProps}
                        className={`
                            flex items-center justify-center pr-2 cursor-grab active:cursor-grabbing
                            ${snapshot.isDragging ? 'text-blue-400' : 'text-gray-600 hover:text-gray-400'}
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
