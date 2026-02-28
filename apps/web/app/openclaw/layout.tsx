export default function OpenClawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="min-h-screen px-6 pt-24 pb-16 md:px-0">{children}</main>;
}
