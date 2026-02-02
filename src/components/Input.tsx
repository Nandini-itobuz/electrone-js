import { useFormContext } from "react-hook-form";

interface InputProps {
  name: string;
  type?: string;
  placeholder?: string;
  label: string;
}

export default function Input({
  name,
  type = "text",
  placeholder,
  label,
}: InputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = errors[name]?.message as string;

  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className={error ? "error" : ""}
      />
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
