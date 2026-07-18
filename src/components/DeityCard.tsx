import { Link } from "@tanstack/react-router";

interface DeityCardProps {
  name: string;
  slug: string;
  description: string | null;
  imageUrl?: string | null;
}

export function DeityCard({ name, slug, description, imageUrl }: DeityCardProps) {
  const initial = name.charAt(0);
  return (
    <Link
      to="/deity/$slug"
      params={{ slug }}
      className="group block rounded-xl border border-outline-variant bg-surface-container-lowest p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(77,58,38,0.08)]"
    >
      <div className="relative mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-surface-container text-3xl font-serif font-semibold text-primary transition-colors group-hover:bg-accent-gold/10">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </div>
      <h3 className="font-serif text-xl font-semibold text-on-surface">{name}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant leading-relaxed">
        {description}
      </p>
    </Link>
  );
}
