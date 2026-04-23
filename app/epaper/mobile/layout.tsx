export default function MobileEpaperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mobile-epaper-layout min-h-screen w-screen relative bg-gray-100">
      {children}
    </div>
  );
}