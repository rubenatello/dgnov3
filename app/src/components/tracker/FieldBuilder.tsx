import { useState } from 'react';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faGripVertical, faEdit } from '@fortawesome/free-solid-svg-icons';
import type { TrackerField } from '../../types/models';
import { US_STATES } from '../../utils/states';

interface FieldBuilderProps {
  fields: TrackerField[];
  onChange: (fields: TrackerField[]) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', description: 'Single line text' },
  { value: 'textarea', label: 'Text Area', description: 'Multi-line text' },
  { value: 'date', label: 'Date', description: 'Date picker' },
  { value: 'select', label: 'Dropdown', description: 'Select from options' },
  { value: 'url', label: 'URL', description: 'Website link' },
  { value: 'file', label: 'File Upload', description: 'File attachment' },
  { value: 'checkbox', label: 'Checkbox', description: 'Yes/No field' },
  { value: 'number', label: 'Number', description: 'Numeric input' },
];

export default function FieldBuilder({ fields, onChange }: FieldBuilderProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newField, setNewField] = useState<Partial<TrackerField>>({
    type: 'text',
    required: false,
    options: []
  });

  function addField() {
    if (!newField.name?.trim()) return;
    
    const field: TrackerField = {
      id: `field_${Date.now()}`,
      name: newField.name.trim(),
      type: newField.type as TrackerField['type'],
      required: newField.required || false,
      placeholder: newField.placeholder?.trim() || '',
      options: newField.options || [],
      maxLength: newField.maxLength,
      order: fields.length
    };

    onChange([...fields, field]);
    setNewField({ type: 'text', required: false, options: [] });
  }

  function updateField(fieldId: string, updates: Partial<TrackerField>) {
    onChange(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  }

  function deleteField(fieldId: string) {
    if (!confirm('Are you sure you want to delete this field?')) return;
    onChange(fields.filter(field => field.id !== fieldId));
  }

  function moveField(fieldId: string, direction: 'up' | 'down') {
    const currentIndex = fields.findIndex(f => f.id === fieldId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    const newFields = [...fields];
    [newFields[currentIndex], newFields[newIndex]] = [newFields[newIndex], newFields[currentIndex]];
    
    // Update order numbers
    newFields.forEach((field, index) => {
      field.order = index;
    });
    
    onChange(newFields);
  }

  function addPredefinedStateField() {
    const stateField: TrackerField = {
      id: `field_${Date.now()}`,
      name: 'State',
      type: 'select',
      required: true,
      placeholder: 'Select State',
      options: US_STATES.map(state => `${state.name} (${state.abbreviation})`),
      order: fields.length
    };
    onChange([...fields, stateField]);
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Custom Fields</h3>
      
      {/* Quick Add Buttons */}
      <div className="flex flex-wrap gap-2 mb-4 p-3 bg-blue-50 rounded border">
        <span className="text-sm font-medium text-blue-700">Quick Add:</span>
        <button
          type="button"
          onClick={() => {
            const dateField: TrackerField = {
              id: `field_${Date.now()}`,
              name: 'Date',
              type: 'date',
              required: true,
              order: fields.length
            };
            onChange([...fields, dateField]);
          }}
          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
        >
          + Date
        </button>
        <button
          type="button"
          onClick={() => {
            const descField: TrackerField = {
              id: `field_${Date.now()}`,
              name: 'Description',
              type: 'textarea',
              required: true,
              placeholder: 'Describe the incident...',
              order: fields.length
            };
            onChange([...fields, descField]);
          }}
          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
        >
          + Description
        </button>
        <button
          type="button"
          onClick={addPredefinedStateField}
          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
        >
          + US States
        </button>
        <button
          type="button"
          onClick={() => {
            const sourceField: TrackerField = {
              id: `field_${Date.now()}`,
              name: 'Source',
              type: 'url',
              required: false,
              placeholder: 'https://example.com/article',
              order: fields.length
            };
            onChange([...fields, sourceField]);
          }}
          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
        >
          + Source URL
        </button>
      </div>

      {/* Existing Fields */}
      {fields.length > 0 && (
        <div className="space-y-3 mb-4">
          {fields.map((field, index) => (
            <div key={field.id} className="bg-white border rounded p-3">
              {editingField === field.id ? (
                <FieldEditor
                  field={field}
                  onSave={(updates) => {
                    updateField(field.id, updates);
                    setEditingField(null);
                  }}
                  onCancel={() => setEditingField(null)}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon icon={faGripVertical} className="text-gray-400 cursor-move" />
                    <div>
                      <span className="font-medium">{field.name}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({FIELD_TYPES.find(t => t.value === field.type)?.label})
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                      {field.options && field.options.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Options: {field.options.slice(0, 3).join(', ')}
                          {field.options.length > 3 && ` (+${field.options.length - 3} more)`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveField(field.id, 'up')}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(field.id, 'down')}
                      disabled={index === fields.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingField(field.id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit field"
                    >
                      <Icon icon={faEdit} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteField(field.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete field"
                    >
                      <Icon icon={faTrash} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Field */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Add New Field</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium mb-1">Field Name *</label>
            <input
              type="text"
              value={newField.name || ''}
              onChange={(e) => setNewField({ ...newField, name: e.target.value })}
              placeholder="e.g., City, Description, Source"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Field Type</label>
            <select
              value={newField.type}
              onChange={(e) => setNewField({ ...newField, type: e.target.value as TrackerField['type'] })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              {FIELD_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newField.required || false}
              onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
            />
            <span className="text-sm">Required field</span>
          </label>
        </div>

        <button
          type="button"
          onClick={addField}
          disabled={!newField.name?.trim()}
          className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Icon icon={faPlus} />
          Add Field
        </button>
      </div>
    </div>
  );
}

// Field Editor Component
interface FieldEditorProps {
  field: TrackerField;
  onSave: (updates: Partial<TrackerField>) => void;
  onCancel: () => void;
}

function FieldEditor({ field, onSave, onCancel }: FieldEditorProps) {
  const [editField, setEditField] = useState<TrackerField>({ ...field });
  const [newOption, setNewOption] = useState('');

  function addOption() {
    if (!newOption.trim()) return;
    const options = [...(editField.options || []), newOption.trim()];
    setEditField({ ...editField, options });
    setNewOption('');
  }

  function removeOption(index: number) {
    const options = editField.options?.filter((_, i) => i !== index) || [];
    setEditField({ ...editField, options });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Field Name</label>
          <input
            type="text"
            value={editField.name}
            onChange={(e) => setEditField({ ...editField, name: e.target.value })}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={editField.type}
            onChange={(e) => setEditField({ ...editField, type: e.target.value as TrackerField['type'] })}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            {FIELD_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Placeholder Text</label>
        <input
          type="text"
          value={editField.placeholder || ''}
          onChange={(e) => setEditField({ ...editField, placeholder: e.target.value })}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      {editField.type === 'select' && (
        <div>
          <label className="block text-sm font-medium mb-1">Dropdown Options</label>
          <div className="space-y-2">
            {editField.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const options = [...(editField.options || [])];
                    options[index] = e.target.value;
                    setEditField({ ...editField, options });
                  }}
                  className="flex-1 border rounded px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Icon icon={faTrash} />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Add new option..."
                className="flex-1 border rounded px-2 py-1 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
              />
              <button
                type="button"
                onClick={addOption}
                className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={editField.required}
            onChange={(e) => setEditField({ ...editField, required: e.target.checked })}
          />
          <span className="text-sm">Required field</span>
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(editField)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}