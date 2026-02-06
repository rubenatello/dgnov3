import DashboardLayout from '../../components/dashboard/DashboardLayout';
import SEOHead from '../../components/SEOHead';
import InvestigationBoardEditorV2 from '../../components/investigations/InvestigationBoardEditorV2';

export default function InvestigationsBoardAdminPage() {
  return (
    <DashboardLayout fullWidth>
      <SEOHead
        title="Investigations Board Editor"
        description="Admin editor for investigations board content."
        url="https://dgno.us/dashboard/investigations/epstein-files"
      />
      <InvestigationBoardEditorV2 />
    </DashboardLayout>
  );
}
