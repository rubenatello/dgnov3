import { useState } from 'react';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCheck, faTimes, faExternalLinkAlt, faEye } from '@fortawesome/free-solid-svg-icons';
import type { TrackerField, TrackerIncident } from '../../types/models';
import DynamicForm from './DynamicForm';

interface DynamicTableProps {
  fields: TrackerField[];
  incidents: TrackerIncident[];
  onEdit: (incidentId: string, updates: Record<string, string | number | boolean | Date>) => void;
  onDelete: (incidentId: string) => void;
  showActions?: boolean;
}

export default function DynamicTable({ 
  fields, 
  incidents, 
  onEdit, 
  onDelete, 
  showActions = true 
}: DynamicTableProps) {
  const [editingIncident, setEditingIncident] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, string | number | boolean | Date>>({});

  // Sort fields by order for consistent column display
  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  function startEdit(incident: TrackerIncident) {
    setEditingIncident(incident.id || '');
    // Pre-populate form with existing custom data
    setEditFormData(incident.customData || {});
  }

  function cancelEdit() {
    setEditingIncident(null);
    setEditFormData({});
  }

  function saveEdit() {
    if (editingIncident) {
      onEdit(editingIncident, editFormData);
      setEditingIncident(null);
      setEditFormData({});
    }
  }

  function formatCellValue(field: TrackerField, value: string | number | boolean | Date) {
    if (!value && value !== 0 && value !== false) return '-';

    switch (field.type) {
      case 'date':
        try {
          const date = value instanceof Date ? value : new Date(value as string);
          return date.toLocaleDateString();
        } catch {
          return String(value);
        }

      case 'url':
        if (typeof value === 'string' && value.startsWith('http')) {
          return (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              <Icon icon={faExternalLinkAlt} className="text-xs" />
              Link
            </a>
          );
        }
        return String(value);

      case 'checkbox':
        return (
          <Icon
            icon={value ? faCheck : faTimes}
            className={value ? 'text-green-600' : 'text-red-600'}
          />
        );

      case 'file':
        if (typeof value === 'string' && value.startsWith('http')) {
          return (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              <Icon icon={faEye} className="text-xs" />
              View
            </a>
          );
        }
        return String(value);

      case 'textarea': {
        const text = String(value);
        return text.length > 100 ? (
          <span title={text}>
            {text.substring(0, 100)}...
          </span>
        ) : text;
      }

      default:
        return String(value);
    }
  }

  if (incidents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No incidents found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            {sortedFields.map((field) => (
              <th
                key={field.id}
                className="border border-gray-300 px-3 py-2 text-left text-sm font-medium"
              >
                {field.name}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </th>
            ))}
            {showActions && (
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => {
            const isEditing = editingIncident === incident.id;
            
            return (
              <tr key={incident.id} className="hover:bg-gray-50">
                {sortedFields.map((field) => (
                  <td
                    key={field.id}
                    className="border border-gray-300 px-3 py-2 text-sm"
                  >
                    {isEditing ? (
                      <div className="min-w-[150px]">
                        <DynamicForm
                          fields={[field]}
                          data={editFormData}
                          onChange={setEditFormData}
                          disabled={false}
                        />
                      </div>
                    ) : (
                      <div className="max-w-xs">
                        {formatCellValue(field, incident.customData?.[field.id] ?? '')}
                      </div>
                    )}
                  </td>
                ))}
                {showActions && (
                  <td className="border border-gray-300 px-3 py-2">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="text-green-600 hover:text-green-800"
                            title="Save changes"
                          >
                            <Icon icon={faCheck} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-red-600 hover:text-red-800"
                            title="Cancel editing"
                          >
                            <Icon icon={faTimes} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(incident)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit incident"
                          >
                            <Icon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this incident?')) {
                                onDelete(incident.id || '');
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Delete incident"
                          >
                            <Icon icon={faTrash} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
