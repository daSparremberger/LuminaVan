interface Props {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-beige">{title}</h1>
        {subtitle && <p className="text-beige/40 text-sm mt-2">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
