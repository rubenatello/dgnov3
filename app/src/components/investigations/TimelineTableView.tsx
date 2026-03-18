import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faMapMarkerAlt,
  faEdit,
  faTrash,
  faFileAlt,
  faChevronLeft,
  faChevronRight,
  faSortUp,
  faSortDown,
  faSort,
  faPhone,
  faUsers,
  faPlane,
  faDollarSign,
  faGavel,
  faNewspaper,
  faEllipsisH,
  faExternalLinkAlt,
  faFilePdf,
  faImage,
  faLink,
} from '@fortawesome/free-solid-svg-icons';
import type {
  InvestigationPerson,
  InvestigationLocation,
  TimelineEvent,
  TimelineEventType,
} from '../../types/investigations';

const eventTypeConfig: Record<TimelineEventType, { icon: typeof faPhone; label: string; color: string }> = {
  communication: { icon: faPhone, label: 'Communication', color: 'text-blue-600' },
  meeting: { icon: faUsers, label: 'Meeting', color: 'text-purple-600' },
  travel: { icon: faPlane, label: 'Travel', color: 'text-orange-600' },
  transaction: { icon: faDollarSign, label: 'Transaction', color: 'text-green-600' },
  legal: { icon: faGavel, label: 'Legal', color: 'text-red-600' },
  media: { icon: faNewspaper, label: 'Media', color: 'text-cyan-600' },
  other: { icon: faEllipsisH, label: 'Other', color: 'text-gray-600' },
};

type SortField = 'date' | 'title' | 'type';

interface Props {
  events: TimelineEvent[];
  people: InvestigationPerson[];
  locations: InvestigationLocation[];
  readOnly: boolean;
  onEventClick: (id: string) => void;
  onEventEdit: (id: string) => void;
  onEventDelete: (id: string) => void;
}

export default function TimelineTableView({
  events,
  people,
  locations,
  readOnly,
  onEventClick,
  onEventEdit,
  onEventDelete,
}: Props) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [eventTypeFilter, setEventTypeFilter] = useState<TimelineEventType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events;

    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter((e) => e.eventType === eventTypeFilter);
    }

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'type') {
        comparison = a.eventType.localeCompare(b.eventType);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [events, eventTypeFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedEvents.length / itemsPerPage);

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedEvents.slice(start, start + itemsPerPage);
  }, [filteredAndSortedEvents, currentPage, itemsPerPage]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return faSort;
    return sortDirection === 'asc' ? faSortUp : faSortDown;
  };

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisible; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-ink whitespace-nowrap">Filter:</label>
          <select
            value={eventTypeFilter}
            onChange={(e) => {
              setEventTypeFilter(e.target.value as typeof eventTypeFilter);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-stone/30 bg-white"
          >
            <option value="all">All Events ({events.length})</option>
            {(Object.keys(eventTypeConfig) as TimelineEventType[]).map((type) => {
              const count = events.filter((e) => e.eventType === type).length;
              if (count === 0) return null;
              return (
                <option key={type} value={type}>
                  {eventTypeConfig[type].label} ({count})
                </option>
              );
            })}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-inkMuted">Per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-stone/30 bg-white"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone/5 border-b border-stone/20">
              <tr>
                <th
                  onClick={() => toggleSort('date')}
                  className="px-4 py-3 text-left text-xs font-semibold text-inkMuted uppercase tracking-wider cursor-pointer hover:bg-stone/10 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Date
                    <FontAwesomeIcon icon={getSortIcon('date')} className="text-[10px]" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('type')}
                  className="px-4 py-3 text-left text-xs font-semibold text-inkMuted uppercase tracking-wider cursor-pointer hover:bg-stone/10 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Type
                    <FontAwesomeIcon icon={getSortIcon('type')} className="text-[10px]" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('title')}
                  className="px-4 py-3 text-left text-xs font-semibold text-inkMuted uppercase tracking-wider cursor-pointer hover:bg-stone/10 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Event
                    <FontAwesomeIcon icon={getSortIcon('title')} className="text-[10px]" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inkMuted uppercase tracking-wider">
                  People
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inkMuted uppercase tracking-wider">
                  Locations
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inkMuted uppercase tracking-wider">
                  Evidence
                </th>
                {!readOnly && (
                  <th className="px-4 py-3 text-right text-xs font-semibold text-inkMuted uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone/10">
              {paginatedEvents.map((event) => {
                const eventPeople = people.filter((p) => event.peopleIds.includes(p.id));
                const eventLocations = locations.filter((l) => event.locationIds.includes(l.id));
                const config = eventTypeConfig[event.eventType];
                const isExpanded = expandedEventId === event.id;

                return (
                  <tr
                    key={event.id}
                    onClick={() => onEventClick(event.id)}
                    className="hover:bg-violet-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-ink whitespace-nowrap">
                      <div>{event.date}</div>
                      {event.time && <div className="text-[10px] text-inkMuted">{event.time}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${config.color} bg-violet-50`}
                      >
                        <FontAwesomeIcon icon={config.icon} className="text-[10px]" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-medium text-ink text-sm">{event.title}</div>
                      {event.description && (
                        <div className="text-xs text-inkMuted mt-1 line-clamp-2">{event.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {eventPeople.slice(0, 3).map((person) => (
                          <span
                            key={person.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-[11px] text-ink"
                          >
                            <FontAwesomeIcon icon={faUser} className="text-sky-500 text-[8px]" />
                            {person.name}
                          </span>
                        ))}
                        {eventPeople.length > 3 && (
                          <span className="text-[11px] text-inkMuted px-1">+{eventPeople.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {eventLocations.slice(0, 2).map((location) => (
                          <span
                            key={location.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[11px] text-ink"
                          >
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-emerald-500 text-[8px]" />
                            {location.name}
                          </span>
                        ))}
                        {eventLocations.length > 2 && (
                          <span className="text-[11px] text-inkMuted px-1">+{eventLocations.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {event.documents.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedEventId(isExpanded ? null : event.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-stone/10 hover:bg-violet-50 text-xs text-ink transition-colors"
                        >
                          <FontAwesomeIcon icon={faFileAlt} className="text-inkMuted text-[10px]" />
                          {event.documents.length}
                        </button>
                      )}
                      {isExpanded && event.documents.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {event.documents.map((doc, i) => (
                            <a
                              key={i}
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 text-xs text-violet-600 hover:underline"
                            >
                              <FontAwesomeIcon
                                icon={doc.type === 'pdf' ? faFilePdf : doc.type === 'image' ? faImage : faLink}
                                className={`text-[10px] ${
                                  doc.type === 'pdf' ? 'text-red-500' : doc.type === 'image' ? 'text-blue-500' : 'text-gray-500'
                                }`}
                              />
                              {doc.label}
                              <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[8px]" />
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                    {!readOnly && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventEdit(event.id);
                            }}
                            className="p-1.5 text-xs text-accent hover:bg-accent/10 rounded transition-colors"
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventDelete(event.id);
                            }}
                            className="p-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {paginatedEvents.length === 0 && (
                <tr>
                  <td colSpan={readOnly ? 6 : 7} className="px-4 py-12 text-center text-inkMuted text-sm">
                    No events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl border border-stone p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-inkMuted">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedEvents.length)} of{' '}
            {filteredAndSortedEvents.length} events
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-stone/30 hover:bg-stone/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-xs text-inkMuted" />
            </button>

            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === pageNum
                    ? 'bg-accent text-white'
                    : 'hover:bg-stone/10 border border-stone/30 text-inkMuted'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-stone/30 hover:bg-stone/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-xs text-inkMuted" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
