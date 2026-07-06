import logoUrl from "../../assets/logo.png";

export function Logo() {
  return (
    <div className="flex items-center gap-2 select-none">
      <img src={logoUrl} alt="" className="h-8 w-8 object-contain dark:invert" />
      <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        Sala de Reuniones
      </span>
    </div>
  );
}
