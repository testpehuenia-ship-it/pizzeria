export default function CtaButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-primary text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 hover:shadow-lg"
    >
      {children}
    </button>
  );
}