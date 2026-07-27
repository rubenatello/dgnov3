import { useMemo } from 'react';
import type { MouseEvent, TouchEvent, RefObject } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faMapMarkerAlt,
  faPhone,
  faUsers,
  faPlane,
  faDollarSign,
  faGavel,
  faNewspaper,
  faEllipsisH,
} from '@fortawesome/free-solid-svg-icons';
import type {
  InvestigationPerson,
  InvestigationLocation,
  TimelineEvent,
  TimelineEventType,
  BoardConnection,
} from '../../types/investigations';

// ============================================
// Layout Constants
// ============================================
const EVENT_W = 180;
const EVENT_H = 74;
const SATELLITE_SIZE = 52; // small satellite circles for people/locations

// Serpentine layout
const EVENTS_PER_ROW = 4;
const EVENT_SPACING_X = 300;
const ROW_SPACING_Y = 320;
const MARGIN_LEFT = 200;
const MARGIN_TOP = 120;

// Satellite orbit
const ORBIT_RADIUS = 100;

const eventTypeConfig: Record<TimelineEventType, { icon: typeof faPhone; label: string; hex: string }> = {
  communication: { icon: faPhone, label: 'Comm', hex: '#2563eb' },
  meeting: { icon: faUsers, label: 'Meeting', hex: '#9333ea' },
  travel: { icon: faPlane, label: 'Travel', hex: '#ea580c' },
  transaction: { icon: faDollarSign, label: 'Finance', hex: '#16a34a' },
  legal: { icon: faGavel, label: 'Legal', hex: '#dc2626' },
  media: { icon: faNewspaper, label: 'Media', hex: '#0891b2' },
  other: { icon: faEllipsisH, label: 'Other', hex: '#6b7280' },
};

const nodeColors = {
  person: { ring: '#0ea5e9', glow: 'rgba(14,165,233,0.35)', border: '#7dd3fc' },
  location: { ring: '#10b981', glow: 'rgba(16,185,129,0.35)', border: '#6ee7b7' },
  event: { ring: '#8b5cf6', glow: 'rgba(139,92,246,0.25)' },
};

interface Props {
  people: InvestigationPerson[];
  locations: InvestigationLocation[];
  events: TimelineEvent[];
  connections: BoardConnection[];
  selectedEntity: { type: 'person' | 'location' | 'event'; id: string } | null;
  scale: number;
  offset: { x: number; y: number };
  isPanning: boolean;
  filterType: 'all' | 'people' | 'locations' | 'events';
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLDivElement | null>;
  onMouseDown: (e: MouseEvent<HTMLDivElement>) => void;
  onMouseMove: (e: MouseEvent<HTMLDivElement>) => void;
  onMouseUp: () => void;
  onTouchStart?: (e: TouchEvent<HTMLDivElement>) => void;
  onTouchMove?: (e: TouchEvent<HTMLDivElement>) => void;
  onTouchEnd?: () => void;
  onEntityClick: (type: 'person' | 'location' | 'event', id: string) => void;
}

interface Pos { x: number; y: number }

// Satellite instance: a person or location rendered near a specific event
interface SatelliteNode {
  key: string; // unique render key e.g. "person-abc-evt-xyz"
  entityType: 'person' | 'location';
  entityId: string;
  eventId: string;
  x: number;
  y: number;
}

export default function BoardCanvasView({
  people,
  locations,
  events,
  selectedEntity,
  scale,
  offset,
  isPanning,
  filterType,
  containerRef,
  canvasRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onEntityClick,
}: Props) {
  // ============================================
  // Serpentine Event Layout
  // ============================================
  const eventPositions = useMemo(() => {
    const positions = new Map<string, Pos>();
    const sorted = [...events].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sorted.forEach((event, i) => {
      const row = Math.floor(i / EVENTS_PER_ROW);
      const col = i % EVENTS_PER_ROW;
      const isReversed = row % 2 === 1;
      const actualCol = isReversed ? EVENTS_PER_ROW - 1 - col : col;

      positions.set(event.id, {
        x: MARGIN_LEFT + actualCol * EVENT_SPACING_X,
        y: MARGIN_TOP + row * ROW_SPACING_Y,
      });
    });

    return positions;
  }, [events]);

  // ============================================
  // Satellite Nodes: per-instance people & locations around each event
  // ============================================
  const satellites = useMemo(() => {
    const nodes: SatelliteNode[] = [];
    const sorted = [...events].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sorted.forEach((event) => {
      const eventPos = eventPositions.get(event.id);
      if (!eventPos) return;

      // Center of the event node
      const cx = eventPos.x + EVENT_W / 2;
      const cy = eventPos.y + EVENT_H / 2;

      // Combine all satellites for this event
      const allSatellites: { type: 'person' | 'location'; id: string }[] = [
        ...event.peopleIds.map((id) => ({ type: 'person' as const, id })),
        ...event.locationIds.map((id) => ({ type: 'location' as const, id })),
      ];

      const total = allSatellites.length;
      if (total === 0) return;

      // Distribute satellites in a circle around the event
      // People go to the upper arc, locations to the lower arc
      const peopleCount = event.peopleIds.length;
      const locationCount = event.locationIds.length;

      // People: spread across top arc (-160deg to -20deg)
      event.peopleIds.forEach((personId, idx) => {
        const arcStart = -Math.PI * 0.88; // ~-160deg
        const arcEnd = -Math.PI * 0.12;   // ~-20deg
        const angle = peopleCount === 1
          ? -Math.PI / 2 // directly above
          : arcStart + (idx / (peopleCount - 1)) * (arcEnd - arcStart);

        nodes.push({
          key: `person-${personId}-evt-${event.id}`,
          entityType: 'person',
          entityId: personId,
          eventId: event.id,
          x: cx + Math.cos(angle) * ORBIT_RADIUS - SATELLITE_SIZE / 2,
          y: cy + Math.sin(angle) * ORBIT_RADIUS - SATELLITE_SIZE / 2,
        });
      });

      // Locations: spread across bottom arc (20deg to 160deg)
      event.locationIds.forEach((locationId, idx) => {
        const arcStart = Math.PI * 0.12;
        const arcEnd = Math.PI * 0.88;
        const angle = locationCount === 1
          ? Math.PI / 2 // directly below
          : arcStart + (idx / (locationCount - 1)) * (arcEnd - arcStart);

        nodes.push({
          key: `location-${locationId}-evt-${event.id}`,
          entityType: 'location',
          entityId: locationId,
          eventId: event.id,
          x: cx + Math.cos(angle) * ORBIT_RADIUS - SATELLITE_SIZE / 2,
          y: cy + Math.sin(angle) * ORBIT_RADIUS - SATELLITE_SIZE / 2,
        });
      });
    });

    return nodes;
  }, [events, eventPositions]);

  // ============================================
  // Timeline spine path (serpentine curves between events)
  // ============================================
  const timelinePath = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    if (sorted.length < 2) return null;

    const points: Pos[] = sorted.map((ev) => {
      const pos = eventPositions.get(ev.id);
      if (!pos) return { x: 0, y: 0 };
      return { x: pos.x + EVENT_W / 2, y: pos.y + EVENT_H / 2 };
    });

    // Build smooth path through all event centers
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // Use a smooth curve: control points at 50% x
      const cpx1 = prev.x + (curr.x - prev.x) * 0.5;
      const cpy1 = prev.y;
      const cpx2 = prev.x + (curr.x - prev.x) * 0.5;
      const cpy2 = curr.y;
      d += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
    }

    return d;
  }, [events, eventPositions]);

  // ============================================
  // Focus logic: which entities are "active"
  // ============================================
  // When a person is selected, highlight ALL satellite instances of that person
  // When an event is selected, highlight its direct satellites
  // When a location is selected, highlight ALL satellite instances of that location
  const activeSet = useMemo(() => {
    if (!selectedEntity) return null;
    const active = new Set<string>();

    if (selectedEntity.type === 'event') {
      // The event itself
      active.add(`event:${selectedEntity.id}`);
      // All satellites of this event
      satellites.forEach((s) => {
        if (s.eventId === selectedEntity.id) {
          active.add(s.key);
        }
      });
    } else {
      // Person or location selected — highlight all their instances + connected events
      const entityKey = `${selectedEntity.type}:${selectedEntity.id}`;
      active.add(entityKey);
      satellites.forEach((s) => {
        if (s.entityType === selectedEntity.type && s.entityId === selectedEntity.id) {
          active.add(s.key);
          active.add(`event:${s.eventId}`);
        }
      });
    }

    return active;
  }, [selectedEntity, satellites]);

  const isEventActive = (eventId: string) => {
    if (!activeSet) return true; // nothing selected, everything visible
    return activeSet.has(`event:${eventId}`);
  };

  const isSatelliteActive = (sat: SatelliteNode) => {
    if (!activeSet) return false; // nothing selected, satellites are subtle
    return activeSet.has(sat.key);
  };

  const isSatelliteHighlighted = (sat: SatelliteNode) => {
    if (!selectedEntity) return false;
    // Highlighted = this specific satellite is directly connected to the selection
    if (selectedEntity.type === 'event') {
      return sat.eventId === selectedEntity.id;
    }
    return sat.entityType === selectedEntity.type && sat.entityId === selectedEntity.id;
  };

  // ============================================
  // Canvas size
  // ============================================
  const canvasSize = useMemo(() => {
    const allX: number[] = [];
    const allY: number[] = [];
    eventPositions.forEach((pos) => {
      allX.push(pos.x + EVENT_W);
      allY.push(pos.y + EVENT_H);
    });
    satellites.forEach((s) => {
      allX.push(s.x + SATELLITE_SIZE);
      allY.push(s.y + SATELLITE_SIZE);
    });
    return {
      width: Math.max(2000, (allX.length ? Math.max(...allX) : 0) + 300),
      height: Math.max(1000, (allY.length ? Math.max(...allY) : 0) + 200),
    };
  }, [eventPositions, satellites]);

  // ============================================
  // Connection counts for person/location badge
  // ============================================
  const entityEventCounts = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach((ev) => {
      ev.peopleIds.forEach((pid) => {
        const key = `person:${pid}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      });
      ev.locationIds.forEach((lid) => {
        const key = `location:${lid}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });
    return counts;
  }, [events]);

  // ============================================
  // Render
  // ============================================
  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Investigation board canvas — drag to pan, scroll to zoom"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="flex-1 overflow-hidden cursor-grab relative touch-none"
      style={{
        cursor: isPanning ? 'grabbing' : 'grab',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
      }}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #cbd5e1 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px',
          opacity: 0.3,
        }}
      />

      <div
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {/* SVG layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={canvasSize.width}
          height={canvasSize.height}
          viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
        >
          <defs>
            <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Serpentine timeline path */}
          {timelinePath && (
            <path
              d={timelinePath}
              fill="none"
              stroke="#c4b5fd"
              strokeWidth={2.5}
              strokeOpacity={0.4}
              strokeDasharray="10,8"
            />
          )}

          {/* Dot markers at each event center on the spine */}
          {events.map((ev) => {
            const pos = eventPositions.get(ev.id);
            if (!pos) return null;
            return (
              <circle
                key={`spine-dot-${ev.id}`}
                cx={pos.x + EVENT_W / 2}
                cy={pos.y + EVENT_H / 2}
                r={5}
                fill="#c4b5fd"
                fillOpacity={0.5}
              />
            );
          })}

          {/* Connection lines from events to their satellites (shown when something is selected) */}
          {selectedEntity &&
            satellites.map((sat) => {
              const highlighted = isSatelliteHighlighted(sat);
              if (!highlighted) return null;

              const eventPos = eventPositions.get(sat.eventId);
              if (!eventPos) return null;

              const fromX = eventPos.x + EVENT_W / 2;
              const fromY = eventPos.y + EVENT_H / 2;
              const toX = sat.x + SATELLITE_SIZE / 2;
              const toY = sat.y + SATELLITE_SIZE / 2;

              const lineColor = sat.entityType === 'person'
                ? nodeColors.person.ring
                : nodeColors.location.ring;

              return (
                <g key={`line-${sat.key}`}>
                  {/* Glow */}
                  <line
                    x1={fromX} y1={fromY}
                    x2={toX} y2={toY}
                    stroke={lineColor}
                    strokeWidth={5}
                    strokeOpacity={0.12}
                    filter="url(#line-glow)"
                  />
                  {/* Main line */}
                  <line
                    x1={fromX} y1={fromY}
                    x2={toX} y2={toY}
                    stroke={lineColor}
                    strokeWidth={1.5}
                    strokeOpacity={0.6}
                    strokeDasharray={sat.entityType === 'location' ? '4,3' : undefined}
                  />
                </g>
              );
            })}

          {/* Cross-event lines: when a person/location is selected, draw lines between all their event instances */}
          {selectedEntity && (selectedEntity.type === 'person' || selectedEntity.type === 'location') && (() => {
            const instanceEvents = satellites
              .filter((s) => s.entityType === selectedEntity.type && s.entityId === selectedEntity.id)
              .map((s) => {
                const pos = eventPositions.get(s.eventId);
                return pos ? { x: pos.x + EVENT_W / 2, y: pos.y + EVENT_H / 2 } : null;
              })
              .filter(Boolean) as Pos[];

            if (instanceEvents.length < 2) return null;

            // Draw connecting lines between consecutive events
            return instanceEvents.map((pos, i) => {
              if (i === 0) return null;
              const prev = instanceEvents[i - 1];
              const lineColor = selectedEntity.type === 'person'
                ? nodeColors.person.ring
                : nodeColors.location.ring;
              return (
                <line
                  key={`cross-${i}`}
                  x1={prev.x} y1={prev.y}
                  x2={pos.x} y2={pos.y}
                  stroke={lineColor}
                  strokeWidth={2}
                  strokeOpacity={0.3}
                  strokeDasharray="6,4"
                />
              );
            });
          })()}
        </svg>

        {/* Event nodes */}
        {(filterType === 'all' || filterType === 'events') &&
          events.map((event) => {
            const pos = eventPositions.get(event.id);
            if (!pos) return null;
            const config = eventTypeConfig[event.eventType];
            const isSelected = selectedEntity?.type === 'event' && selectedEntity.id === event.id;
            const active = isEventActive(event.id);

            return (
              <button
                key={event.id}
                aria-label={`${config.label} event: ${event.title}, ${event.date}`}
                onClick={() => onEntityClick('event', event.id)}
                className="absolute rounded-2xl px-3 py-2 text-left transition-all duration-300"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: EVENT_W,
                  opacity: active ? 1 : 0.2,
                  background: isSelected ? 'white' : 'rgba(255,255,255,0.95)',
                  border: `2px solid ${isSelected ? config.hex : '#e2e8f0'}`,
                  boxShadow: isSelected
                    ? `0 0 24px ${nodeColors.event.glow}, 0 4px 16px rgba(0,0,0,0.12)`
                    : '0 1px 4px rgba(0,0,0,0.06)',
                  zIndex: isSelected ? 20 : active ? 10 : 2,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isSelected ? config.hex : '#ede9fe',
                      color: isSelected ? 'white' : config.hex,
                    }}
                  >
                    <FontAwesomeIcon icon={config.icon} className="text-xs" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="font-semibold leading-tight line-clamp-2 block"
                      style={{ fontSize: '11px', color: '#1D212B' }}
                    >
                      {event.title}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-inkMuted">{event.date}</span>
                      {event.peopleIds.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] text-sky-500">
                          <FontAwesomeIcon icon={faUser} className="text-[7px]" />
                          {event.peopleIds.length}
                        </span>
                      )}
                      {event.locationIds.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] text-emerald-500">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[7px]" />
                          {event.locationIds.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

        {/* Satellite nodes: per-instance people & locations around events */}
        {(filterType === 'all' || filterType === 'people' || filterType === 'locations') &&
          satellites.map((sat) => {
            const entity =
              sat.entityType === 'person'
                ? people.find((p) => p.id === sat.entityId)
                : locations.find((l) => l.id === sat.entityId);
            if (!entity) return null;

            // Skip if filter doesn't match
            if (filterType === 'people' && sat.entityType !== 'person') return null;
            if (filterType === 'locations' && sat.entityType !== 'location') return null;

            const highlighted = isSatelliteHighlighted(sat);
            const active = isSatelliteActive(sat);
            const isPersonSelected =
              selectedEntity?.type === sat.entityType && selectedEntity.id === sat.entityId;

            const isPerson = sat.entityType === 'person';
            const person = isPerson ? (entity as InvestigationPerson) : null;
            const location = !isPerson ? (entity as InvestigationLocation) : null;

            const colors = isPerson ? nodeColors.person : nodeColors.location;
            const totalEvents = entityEventCounts.get(`${sat.entityType}:${sat.entityId}`) || 0;

            // Determine visibility: always show when nothing selected, or when highlighted
            const showFull = !selectedEntity || highlighted || isPersonSelected;
            const dimmed = selectedEntity && !active && !isPersonSelected;

            return (
              <button
                key={sat.key}
                aria-label={`${isPerson ? 'Person' : 'Location'}: ${entity.name}${totalEvents > 1 ? `, ${totalEvents} events` : ''}`}
                onClick={() => onEntityClick(sat.entityType, sat.entityId)}
                className="absolute transition-all duration-300 flex flex-col items-center"
                style={{
                  left: sat.x,
                  top: sat.y,
                  width: SATELLITE_SIZE,
                  opacity: dimmed ? 0.1 : showFull ? 1 : 0.5,
                  zIndex: highlighted || isPersonSelected ? 15 : 5,
                  transform: highlighted ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                {/* Circle avatar */}
                <div
                  className="rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    width: SATELLITE_SIZE,
                    height: SATELLITE_SIZE,
                    background: isPerson
                      ? (person?.imageUrl ? 'transparent' : (isPersonSelected ? colors.ring : '#bae6fd'))
                      : (location?.imageUrl ? 'transparent' : (isPersonSelected ? colors.ring : '#a7f3d0')),
                    border: `2.5px solid ${isPersonSelected ? colors.ring : colors.border}`,
                    boxShadow: isPersonSelected || highlighted
                      ? `0 0 16px ${colors.glow}, 0 0 0 3px ${colors.glow}`
                      : '0 1px 4px rgba(0,0,0,0.08)',
                  }}
                >
                  {isPerson && person?.imageUrl ? (
                    <img src={person.imageUrl} alt={person.name} className="w-full h-full object-cover" />
                  ) : !isPerson && location?.imageUrl ? (
                    <img src={location.imageUrl} alt={location.name} className="w-full h-full object-cover" />
                  ) : (
                    <FontAwesomeIcon
                      icon={isPerson ? faUser : faMapMarkerAlt}
                      className="text-sm"
                      style={{
                        color: isPersonSelected ? 'white' : isPerson ? '#0284c7' : '#047857',
                      }}
                    />
                  )}
                </div>

                {/* Name label */}
                <div
                  className="mt-1 px-1.5 py-0.5 rounded-full text-center whitespace-nowrap"
                  style={{
                    background: isPersonSelected ? colors.ring : 'rgba(255,255,255,0.92)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    maxWidth: 90,
                  }}
                >
                  <span
                    className="font-semibold leading-tight line-clamp-1 block"
                    style={{
                      fontSize: '9px',
                      color: isPersonSelected ? 'white' : '#1D212B',
                    }}
                  >
                    {entity.name}
                  </span>
                </div>

                {/* Event count badge (shows when this entity appears in multiple events) */}
                {totalEvents > 1 && (showFull || isPersonSelected) && (
                  <div
                    className="absolute -top-1 -right-1 rounded-full flex items-center justify-center"
                    style={{
                      width: 18,
                      height: 18,
                      background: colors.ring,
                      fontSize: '9px',
                      fontWeight: 700,
                      color: 'white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  >
                    {totalEvents}
                  </div>
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
}
