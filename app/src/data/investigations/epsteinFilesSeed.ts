import type { 
  BoardLink, 
  BoardNode, 
  InvestigationsBoardPayload,
  InvestigationPerson,
  InvestigationLocation,
  TimelineEvent,
} from '../../types/investigations';

export const EPSTEIN_BOARD_TITLE = 'Epstein Files – Investigations Board';

// Legacy exports (for backward compatibility)
export const epsteinNodesSeed: BoardNode[] = [];
export const epsteinLinksSeed: BoardLink[] = [];

// New structure seed data
export const epsteinPeopleSeed: InvestigationPerson[] = [];
export const epsteinLocationsSeed: InvestigationLocation[] = [];
export const epsteinEventsSeed: TimelineEvent[] = [];

export const epsteinBoardSeed: InvestigationsBoardPayload = {
  title: EPSTEIN_BOARD_TITLE,
  description:
    'Interactive investigations board for organizing people, locations, and timeline events with verifiable sources.',
  // New structure
  people: epsteinPeopleSeed,
  locations: epsteinLocationsSeed,
  events: epsteinEventsSeed,
  documents: [],
  // Legacy
  nodes: epsteinNodesSeed,
  links: epsteinLinksSeed,
  isActive: false,
};
