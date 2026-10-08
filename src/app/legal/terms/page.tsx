import LegalDocumentPage from "@/components/LegalDocumentPage";
import { USER_AGREEMENT_BODY, USER_AGREEMENT_TITLE } from "@/lib/legal/user-agreement";

export const metadata = {
  title: "用户服务协议 · AI 灵宠",
};

export default function TermsPage() {
  return <LegalDocumentPage title={USER_AGREEMENT_TITLE} body={USER_AGREEMENT_BODY} />;
}
