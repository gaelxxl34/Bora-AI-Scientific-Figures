// ProjectCard: Thumbnail + metadata for a saved project
// TODO: Show figure thumbnail preview
// TODO: Show last modified date

interface ProjectCardProps {
  id: string;
  title: string;
  thumbnailUrl?: string;
  updatedAt?: string;
}

export function ProjectCard({ title, updatedAt }: ProjectCardProps) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-bora-blue-light cursor-pointer">
      <div className="w-10 h-10 bg-border-gray rounded flex items-center justify-center text-xs text-slate">
        {/* TODO: Thumbnail image */}
        SVG
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        {updatedAt && (
          <p className="text-[10px] text-slate">{updatedAt}</p>
        )}
      </div>
    </div>
  );
}
