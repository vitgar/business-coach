'use client'

import React, { useState } from 'react'
import { 
  CheckCircle2, Circle, ChevronDown, ChevronRight, 
  Edit, Trash2, Plus, Clipboard, AlertCircle, Clock
} from 'lucide-react'
import { EnhancedActionItem } from '@/types/actionItem'

/**
 * Priority Badge component to display priority level with appropriate colors
 */
const PriorityBadge = ({ priority }: { priority?: string }) => {
  if (!priority) return null;
  
  const colorMap: Record<string, string> = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };
  
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colorMap[priority] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
      {priority}
    </span>
  );
};

/**
 * Progress Badge component to display progress status with appropriate colors
 */
const ProgressBadge = ({ progress }: { progress?: string }) => {
  if (!progress) return null;
  
  const colorMap: Record<string, { colors: string, icon: React.ElementType }> = {
    'not started': { 
      colors: 'bg-gray-100 text-gray-800 border-gray-200', 
      icon: Clock 
    },
    'in progress': { 
      colors: 'bg-blue-100 text-blue-800 border-blue-200', 
      icon: Clipboard 
    },
    'complete': { 
      colors: 'bg-green-100 text-green-800 border-green-200', 
      icon: CheckCircle2 
    },
  };
  
  const { colors, icon: Icon } = colorMap[progress] || 
    { colors: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle };
  
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors} inline-flex items-center gap-1`}>
      <Icon size={12} />
      {progress}
    </span>
  );
};

/**
 * CollapsibleActionItem Component
 * 
 * Renders an action item that can be collapsed/expanded
 * Shows child items when expanded
 * 
 * @param {Object} props - Component properties
 * @param {EnhancedActionItem} props.item - The action item to display
 * @param {Function} props.onToggleComplete - Function to call when toggling completion
 * @param {Function} props.onDelete - Function to call when deleting the item
 * @param {Function} props.onEdit - Function to call when editing the item
 * @param {Function} props.onAddSubItem - Function to call when adding a sub-item
 * @param {number} props.depth - Nesting depth for indentation (default: 0)
 */
export default function CollapsibleActionItem({
  item,
  onToggleComplete,
  onDelete,
  onEdit,
  onAddSubItem,
  depth = 0
}: {
  item: EnhancedActionItem;
  onToggleComplete: (id: string, currentStatus: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (item: EnhancedActionItem) => void;
  onAddSubItem: (parentId: string) => void;
  depth?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const hasSubItems = (item.subItems && item.subItems.length > 0) || 
                    (item._count && item._count.children > 0);
  
  /**
   * Toggle completion status of the action item
   */
  const handleToggleComplete = async () => {
    setIsUpdating(true);
    try {
      await onToggleComplete(item.id, item.isCompleted);
    } finally {
      setIsUpdating(false);
    }
  };
  
  /**
   * Delete the action item
   */
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this action item?')) {
      setIsUpdating(true);
      try {
        await onDelete(item.id);
      } finally {
        setIsUpdating(false);
      }
    }
  };
  
  return (
    <div className={`mb-2 ${depth > 0 ? 'ml-6' : ''}`}>
      <div 
        className={`p-3 rounded-lg border ${
          item.isCompleted ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-blue-300'
        } transition-colors ${isExpanded ? 'shadow-sm' : ''}`}
      >
        <div className="flex items-start gap-3">
          {/* Expand/collapse control - only show if it has sub-items */}
          {hasSubItems && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-0.5 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          )}
          
          {/* Completion toggle button */}
          <button
            onClick={handleToggleComplete}
            disabled={isUpdating}
            className={`mt-0.5 flex-shrink-0 focus:outline-none ${
              isUpdating ? 'opacity-50' : ''
            }`}
            aria-label={item.isCompleted ? "Mark as incomplete" : "Mark as complete"}
          >
            {item.isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400" />
            )}
          </button>
          
          {/* Action item content */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Step number if available */}
              {item.stepNumber && (
                <span className="font-medium text-gray-500">
                  Step {item.stepNumber}.
                </span>
              )}
              
              {/* Item title/content */}
              <h3 className={`font-medium ${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                {item.content}
                {/* Display list indicator if available */}
                {item.listId && item.listId !== 'default' && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded inline-flex items-center">
                    {item.listId.startsWith('list-') ? item.listId.replace('list-', 'List ') : item.listId}
                  </span>
                )}
              </h3>
              
              {/* Priority and Progress badges */}
              {!isExpanded && (
                <>
                  {item.priorityLevel && <PriorityBadge priority={item.priorityLevel} />}
                  {item.progress && <ProgressBadge progress={item.progress} />}
                </>
              )}
            </div>
            
            {/* Expanded content */}
            {isExpanded && (
              <div className="mt-3 space-y-2">
                {/* Description */}
                {item.description && (
                  <div className="text-sm text-gray-600">
                    <p>{item.description}</p>
                  </div>
                )}
                
                {/* Metadata section */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.priorityLevel && <PriorityBadge priority={item.priorityLevel} />}
                  {item.progress && <ProgressBadge progress={item.progress} />}
                </div>
                
                {/* Notes */}
                {item.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Notes:</h4>
                    <p className="text-sm text-gray-700">{item.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(item)}
              className="p-1 text-gray-400 hover:text-blue-600 focus:outline-none"
              aria-label="Edit"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-600 focus:outline-none"
              aria-label="Delete"
              disabled={isUpdating}
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => onAddSubItem(item.id)}
              className="p-1 text-gray-400 hover:text-green-600 focus:outline-none"
              aria-label="Add sub-item"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Sub-items */}
      {isExpanded && item.subItems && item.subItems.length > 0 && (
        <div className="mt-2">
          {item.subItems.map(subItem => (
            <CollapsibleActionItem
              key={subItem.id}
              item={subItem}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onEdit={onEdit}
              onAddSubItem={onAddSubItem}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
} 