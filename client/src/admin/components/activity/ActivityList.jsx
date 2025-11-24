import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ActivityItem from "./ActivityItem";

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result.map((item, idx) => ({ ...item, order: idx + 1 }));
};

const ActivityList = ({ activities = [], onReorder, onRefresh }) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    const reordered = reorder(activities, result.source.index, result.destination.index);
    onReorder && onReorder(reordered);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="activities-droppable">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {activities.map((activity, index) => (
              <Draggable key={String(activity.id)} draggableId={String(activity.id)} index={index}>
                {(prov, snapshot) => (
                  <div
                    ref={prov.innerRef}
                    {...prov.draggableProps}
                    {...prov.dragHandleProps}
                    style={{
                      userSelect: "none",
                      ...prov.draggableProps.style,
                      marginBottom: 8,
                      opacity: snapshot.isDragging ? 0.95 : 1,
                    }}
                  >
                    <ActivityItem activity={activity} onRefresh={onRefresh} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default ActivityList;
