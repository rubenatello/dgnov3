import { useState } from 'react';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import { faCalendar, faUpload, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import type { TrackerField } from '../../types/models';
import type { Media } from '../../types/models';
import MediaPicker from '../MediaPicker';

interface DynamicFormProps {
  fields: TrackerField[];
  data: Record<string, string | number | boolean | Date>;
  onChange: (data: Record<string, string | number | boolean | Date>) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  disabled?: boolean;
}

export default function DynamicForm({ 
  fields, 
  data, 
  onChange, 
  onSubmit, 
  submitLabel = "Submit", 
  disabled = false 
}: DynamicFormProps) {
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [activeFileField, setActiveFileField] = useState<string | null>(null);

  // Sort fields by order
  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  function updateValue(fieldId: string, value: string | number | boolean | Date) {
    onChange({ ...data, [fieldId]: value });
  }

  function handleMediaSelect(media: Media) {
    if (activeFileField) {
      updateValue(activeFileField, media.url);
      setMediaPickerOpen(false);
      setActiveFileField(null);
    }
  }

  function renderField(field: TrackerField) {
    const value = data[field.id] || '';
    const commonProps = {
      id: field.id,
      required: field.required,
      disabled,
      className: "w-full border border-stone rounded px-3 py-2 focus:ring-2 focus:ring-accent"
    };

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => updateValue(field.id, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            {...commonProps}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value as string}
            onChange={(e) => updateValue(field.id, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            rows={3}
            {...commonProps}
          />
        );

      case 'date':
        return (
          <div className="relative">
            <input
              type="date"
              value={value instanceof Date ? value.toISOString().split('T')[0] : value as string}
              onChange={(e) => updateValue(field.id, e.target.value)}
              {...commonProps}
            />
            <Icon 
              icon={faCalendar} 
              className="absolute right-3 top-3 text-gray-400 pointer-events-none" 
            />
          </div>
        );

      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => updateValue(field.id, e.target.value)}
            {...commonProps}
          >
            <option value="">{field.placeholder || `Select ${field.name}...`}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'url':
        return (
          <input
            type="url"
            value={value as string}
            onChange={(e) => updateValue(field.id, e.target.value)}
            placeholder={field.placeholder || "https://example.com"}
            {...commonProps}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value as number}
            onChange={(e) => updateValue(field.id, parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            {...commonProps}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => updateValue(field.id, e.target.checked)}
              disabled={disabled}
              className="rounded border-stone focus:ring-accent"
            />
            <span className="text-sm text-gray-600">
              {field.placeholder || `Enable ${field.name}`}
            </span>
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setActiveFileField(field.id);
                setMediaPickerOpen(true);
              }}
              disabled={disabled}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Icon icon={faUpload} />
              {value ? 'Change File' : 'Select File'}
            </button>
            {value && (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                <span className="text-sm text-gray-700 truncate">
                  {typeof value === 'string' && value.startsWith('http') ? 
                    value.split('/').pop() : 
                    'File selected'
                  }
                </span>
                <button
                  type="button"
                  onClick={() => updateValue(field.id, '')}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                  title="Remove file"
                >
                  <Icon icon={faTimes} />
                </button>
              </div>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => updateValue(field.id, e.target.value)}
            placeholder={field.placeholder}
            {...commonProps}
          />
        );
    }
  }

  function validateForm() {
    for (const field of fields) {
      if (field.required && !data[field.id]) {
        return false;
      }
    }
    return true;
  }

  return (
    <div className="space-y-4">
      {sortedFields.map((field) => (
        <div key={field.id}>
          <label className="block text-sm font-medium mb-1">
            {field.name}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderField(field)}
          {field.maxLength && field.type === 'textarea' && (
            <div className="text-xs text-gray-500 mt-1">
              {(data[field.id] as string)?.length || 0}/{field.maxLength} characters
            </div>
          )}
        </div>
      ))}

      {onSubmit && (
        <div className="pt-4 border-t">
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || !validateForm()}
            className="bg-accent text-white px-6 py-2 rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Icon icon={faCheck} />
            {submitLabel}
          </button>
        </div>
      )}

      <MediaPicker
        isOpen={mediaPickerOpen}
        onSelect={handleMediaSelect}
        onClose={() => {
          setMediaPickerOpen(false);
          setActiveFileField(null);
        }}
        filterType="all"
      />
    </div>
  );
}