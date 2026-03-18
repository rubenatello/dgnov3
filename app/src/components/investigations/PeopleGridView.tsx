import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faCalendar,
  faEdit,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import type {
  InvestigationPerson,
  TimelineEvent,
} from '../../types/investigations';

interface Props {
  people: InvestigationPerson[];
  events: TimelineEvent[];
  readOnly: boolean;
  onPersonClick: (id: string) => void;
  onPersonEdit: (id: string) => void;
  onPersonDelete: (id: string) => void;
}

export default function PeopleGridView({
  people,
  events,
  readOnly,
  onPersonClick,
  onPersonEdit,
  onPersonDelete,
}: Props) {
  const sortedPeople = useMemo(() => {
    return [...people]
      .map((person) => ({
        ...person,
        eventCount: events.filter((e) => e.peopleIds.includes(person.id)).length,
      }))
      .sort((a, b) => b.eventCount - a.eventCount);
  }, [people, events]);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">People ({people.length})</h2>
        <p className="text-sm text-inkMuted">Sorted by number of related events</p>
      </div>

      {sortedPeople.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedPeople.map((person) => (
            <div
              key={person.id}
              onClick={() => onPersonClick(person.id)}
              className="bg-white rounded-xl border-2 border-sky-200 p-4 hover:shadow-lg hover:border-sky-400 transition-all cursor-pointer group"
            >
              <div className="flex flex-col items-center mb-3">
                {person.imageUrl ? (
                  <img
                    src={person.imageUrl}
                    alt={person.name}
                    className="w-20 h-20 rounded-full object-cover mb-2"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-sky-100 flex items-center justify-center mb-2">
                    <FontAwesomeIcon icon={faUser} className="text-sky-500 text-2xl" />
                  </div>
                )}

                <h3 className="font-semibold text-ink text-center leading-tight">{person.name}</h3>
                {person.title && (
                  <p className="text-xs text-inkMuted text-center mt-1">{person.title}</p>
                )}
              </div>

              {person.bio && <p className="text-xs text-inkMuted line-clamp-2 mb-3">{person.bio}</p>}

              <div className="flex items-center justify-center gap-2 py-2 px-3 bg-sky-50 rounded-lg">
                <FontAwesomeIcon icon={faCalendar} className="text-sky-500 text-xs" />
                <span className="text-sm font-medium text-ink">
                  {person.eventCount} {person.eventCount === 1 ? 'event' : 'events'}
                </span>
              </div>

              {!readOnly && (
                <div className="mt-3 pt-3 border-t border-sky-100 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPersonEdit(person.id);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs text-accent border border-accent/30 rounded-lg hover:bg-accent hover:text-white transition-colors"
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPersonDelete(person.id);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-1" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mx-auto mb-3">
            <FontAwesomeIcon icon={faUser} className="text-sky-400 text-2xl" />
          </div>
          <p className="text-inkMuted">No people added yet</p>
        </div>
      )}
    </div>
  );
}
