import { useRef, useEffect, KeyboardEvent } from "react";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}

const EditableText = ({
  value,
  onChange,
  editable = false,
  tag: Tag = "p",
  className = "",
  style,
  placeholder = "Escribe aquí...",
}: EditableTextProps) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  const handleBlur = () => {
    if (ref.current) {
      const newValue = ref.current.textContent || "";
      if (newValue !== value) {
        onChange(newValue);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && Tag !== "p") {
      e.preventDefault();
      ref.current?.blur();
    }
  };

  if (!editable) {
    return <Tag className={className} style={style}>{value}</Tag>;
  }

  return (
    <Tag
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`${className} outline-none ring-0 focus:ring-2 focus:ring-primary/30 focus:bg-primary/5 rounded-md transition-all cursor-text`}
      style={style}
      data-placeholder={placeholder}
    />
  );
};

export default EditableText;
