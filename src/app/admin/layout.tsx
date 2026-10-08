import AdminGate from "@/components/admin/AdminGate";

export const metadata = {
  title: "运营后台 · AI Fortune",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 pb-8 pt-4">
      <AdminGate>{children}</AdminGate>
    </div>
  );
}
