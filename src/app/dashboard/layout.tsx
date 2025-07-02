
import Header from '@/components/layout/header';

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Persisting the sidebar state in the cookie.
  return (
    <>
      <Header />
      {/* page main content */}
      {children}
      {/* page main content ends */}
    </>
  );
}
