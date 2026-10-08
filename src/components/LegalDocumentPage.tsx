import BackLink from "@/components/ui/BackLink";

interface LegalDocumentPageProps {
  title: string;
  body: string;
}

export default function LegalDocumentPage({ title, body }: LegalDocumentPageProps) {
  return (
    <div className="px-4 pb-8 pt-2">
      <BackLink href="/" label="返回首页" className="mb-3" />
      <h1 className="page-title mb-4">{title}</h1>
      <article className="app-card whitespace-pre-wrap text-[11px] leading-relaxed text-app-muted">
        {body}
      </article>
    </div>
  );
}
