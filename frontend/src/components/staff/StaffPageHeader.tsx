type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
};
export default function StaffPageHeader({
  eyebrow,
  title,
  description,
  children,
}: Props) {
  return (
    <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
