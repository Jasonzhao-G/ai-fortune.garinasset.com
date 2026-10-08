import LegalDocumentPage from "@/components/LegalDocumentPage";
import { PRIVACY_POLICY_BODY, PRIVACY_POLICY_TITLE } from "@/lib/legal/privacy-policy";

export const metadata = {
  title: "隐私政策 · AI 灵宠",
};

export default function PrivacyPage() {
  return <LegalDocumentPage title={PRIVACY_POLICY_TITLE} body={PRIVACY_POLICY_BODY} />;
}
