import { Navbar } from "@/components/navbar";

export default function OpenClawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen px-6 pt-24 pb-16">{children}</main>
    </>
  );
}
