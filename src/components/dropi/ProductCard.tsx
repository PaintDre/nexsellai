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
    className="group rounded-xl border border-border/60 bg-card/70 backdrop-blur-md overflow-hidden transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/[0.06] dark:hover:shadow-black/[0.25] hover:border-primary/40 active:scale-[0.98]"
  >
    <div className="aspect-square bg-muted/60 overflow-hidden relative">
      {image_main ? (
        <img
          src={image_main}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
          Sin imagen
        </div>
      )}
      {/* Subtle vignette on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden />
    </div>
    <div className="p-2.5 sm:p-3 space-y-1.5">
      <h3 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
        {name}
      </h3>
      {category && (
        <span className="inline-block rounded-md bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate max-w-full">
          {category}
        </span>
      )}
    </div>
  </Link>
);
