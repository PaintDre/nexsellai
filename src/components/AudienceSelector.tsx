import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const audienceColumns = [
  {
    title: "Edad",
    options: ["18-24", "25-34", "35-44", "45+"],
  },
  {
    title: "Intereses",
    options: ["Fitness", "Tecnología", "Hogar", "Belleza", "Salud"],
  },
  {
    title: "Tipo de cliente",
    options: ["Compradores impulsivos", "Compradores racionales", "Padres", "Deportistas"],
  },
];

interface AudienceSelectorProps {
  selected: string[];
  onChange: (audiences: string[]) => void;
}

const AudienceSelector = ({ selected, onChange }: AudienceSelectorProps) => {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-3">
      <Label>Público objetivo *</Label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-lg border p-4 bg-muted/30">
        {audienceColumns.map((col) => (
          <div key={col.title} className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
            <div className="space-y-2">
              {col.options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Checkbox
                    checked={selected.includes(option)}
                    onCheckedChange={() => toggle(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {selected.length} seleccionados
      </p>
    </div>
  );
};

export default AudienceSelector;
