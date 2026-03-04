import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Search } from "lucide-react";

interface Audience {
  id: string;
  name: string;
  usage_count: number;
}

interface AudienceSelectorProps {
  selected: Audience[];
  onChange: (audiences: Audience[]) => void;
  max?: number;
}

const AudienceSelector = ({ selected, onChange, max = 10 }: AudienceSelectorProps) => {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [search, setSearch] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    supabase
      .from("target_audiences")
      .select("*")
      .order("usage_count", { ascending: false })
      .then(({ data }) => {
        if (data) setAudiences(data);
      });
  }, []);

  const filtered = audiences.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) &&
      !selected.some((s) => s.id === a.id)
  );

  const addAudience = (audience: Audience) => {
    if (selected.length >= max) return;
    onChange([...selected, audience]);
    setSearch("");
  };

  const removeAudience = (id: string) => {
    onChange(selected.filter((a) => a.id !== id));
  };

  const addCustom = async () => {
    if (!customValue.trim() || selected.length >= max) return;
    const existing = audiences.find(
      (a) => a.name.toLowerCase() === customValue.trim().toLowerCase()
    );
    if (existing) {
      addAudience(existing);
      setCustomValue("");
      return;
    }
    const { data, error } = await supabase
      .from("target_audiences")
      .insert({ name: customValue.trim() })
      .select()
      .single();
    if (data && !error) {
      setAudiences((prev) => [data, ...prev]);
      addAudience(data);
      setCustomValue("");
    }
  };

  return (
    <div className="space-y-3">
      <Label>Público objetivo * (máx. {max})</Label>

      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((a) => (
            <Badge key={a.id} variant="secondary" className="gap-1 pr-1">
              {a.name}
              <button
                type="button"
                onClick={() => removeAudience(a.id)}
                className="ml-1 rounded-full hover:bg-muted p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {selected.length < max && (
        <>
          {/* Search existing */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar audiencia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-9"
            />
            {showSuggestions && filtered.length > 0 && (
              <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
                {filtered.slice(0, 10).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onMouseDown={() => addAudience(a)}
                  >
                    {a.name}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({a.usage_count} usos)
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add custom */}
          <div className="flex gap-2">
            <Input
              placeholder="Agregar audiencia personalizada..."
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
            />
            <Button type="button" variant="outline" size="icon" onClick={addCustom} disabled={!customValue.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        {selected.length} / {max} audiencias seleccionadas
      </p>
    </div>
  );
};

export default AudienceSelector;
