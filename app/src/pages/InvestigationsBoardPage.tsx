import SEOHead from '../components/SEOHead';
import InvestigationBoardEditorV2 from '../components/investigations/InvestigationBoardEditorV2';

export default function InvestigationsBoardPage() {
  return (
    <div className="bg-white min-h-screen">
      <SEOHead
        title="Epstein Files Investigation Board | DGNO"
        description="Explore DGNO's Epstein Files investigation board: an interactive map of people, documents, timelines, and verified source links."
        url="https://dgno.us/investigations/epstein-files"
      />
      <InvestigationBoardEditorV2 readOnly />
    </div>
  );
}
