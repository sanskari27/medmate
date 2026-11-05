export const Field = ({
  label,
  children,
  field,
}: {
  label: string;
  children: React.ReactNode;
  field?: string;
}) => (
  <div className="pd-field" data-field={field}>
    <label>{label}</label>
    {children}
  </div>
);
