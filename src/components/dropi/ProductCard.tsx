import { Link } from "react-router-dom";

interface Props {
  id: string;
  name: string;
  image_main: string | null;
  category: string | null;
}

export const ProductCard = ({ id, name, image_main, category }: Props) => (
  <Link
    to={`/dropi/${id}`}
    className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:border-primary/30"
  >
    <div className="aspect-square bg-muted overflow-hidden">
      {image_main ? (
        <img
          src={image_main}
          alt={name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
          Sin imagen
        </div>
      )}
    </div>
    <div className="p-3">
      <h3 className="text-sm font-semibold text-foreground line-clamp-2">{name}</h3>
      {category && (
        <span className="mt-1 inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          {category}
        </span>
      )}
    </div>
  </Link>
);
