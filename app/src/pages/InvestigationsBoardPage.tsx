import SEOHead from '../components/SEOHead';
import InvestigationBoardEditor from '../components/investigations/InvestigationBoardEditor';

export default function InvestigationsBoardPage() {
  return (
    <div className="bg-white min-h-screen">
      <SEOHead
        title="Epstein Files Investigation Board | DGNO"
        description="Explore DGNO's Epstein Files investigation board: an interactive map of people, documents, timelines, and verified source links."
        url="https://dgno.us/investigations/epstein-files"
      />
      <InvestigationBoardEditor />
    </div>
  );
}
