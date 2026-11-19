export default function PageHero({ eyebrow, title, children }) {
  return (
    <section className="bg-ivory">
      <div className="container-x pb-10 pt-14 sm:pt-20">
        <p className="eyebrow animate-rise">{eyebrow}</p>
        <h1 className="display-lg mt-4 max-w-4xl animate-rise [animation-delay:80ms]">{title}</h1>
        {children && <p className="mt-6 max-w-2xl animate-rise text-lg leading-relaxed text-charcoal/85 [animation-delay:160ms]">{children}</p>}
      </div>
    </section>
  );
}
