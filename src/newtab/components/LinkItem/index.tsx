import React, { useCallback } from "react";
import Icon from "../Icon";
import { Edit, Trash2 } from "lucide-react";

interface LinkItemProps {
  link: {
    id?: string;
    url: string;
    icon: string;
    title: string;
    description: string;
  };
  handleEditClick?: (linkId: string) => void;
  handleDeleteClick?: (linkId: string) => void;
  handleSkipClick?: (url: string) => void;
}

export default function Index({
  link,
  handleEditClick,
  handleDeleteClick,
  handleSkipClick,
}: LinkItemProps) {
  const onEditClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (link.id && handleEditClick) {
        handleEditClick(link.id);
      }
    },
    [link.id, handleEditClick]
  );

  const onDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (link.id && handleDeleteClick) {
        handleDeleteClick(link.id);
      }
    },
    [link.id, handleDeleteClick]
  );

  /* 跳转链接 */
  const onSkipClick = useCallback(() => {
    if (link.url && handleSkipClick) {
      handleSkipClick(link.url);
    }
  }, [link.url, handleSkipClick]);

  return (
    <div
      className="glass-style-border group/item relative rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl  hover:-translate-y-2 cursor-pointer h-32 flex flex-col justify-center"
      onClick={onSkipClick}
    >
      {link.id && (handleEditClick || handleDeleteClick) && (
        <div className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100">
          <div
            className="flex flex-col items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="text-white/70 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded p-1.5 hover:bg-white/20 transition-colors cursor-pointer"
              onClick={onEditClick}
            >
              <Edit size={16} />
            </button>

            <button
              className="text-white/70 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded p-1.5 hover:bg-white/20 transition-colors cursor-pointer"
              onClick={onDeleteClick}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
      <div className="mb-2 flex items-center justify-center">
        {link.icon && link.icon.startsWith("http") ? (
          <img src={link.icon} alt={link.title} className="w-8 h-8 rounded" />
        ) : (
          <Icon
            name={link.icon || "link"}
            size={32}
            className="text-blue-200/90"
          />
        )}
      </div>
      <div className="text-base font-semibold overflow-hidden text-ellipsis whitespace-nowrap text-blue-200/90">
        {link.title}
      </div>
      {link.description && (
        <div className="text-xs opacity-80 overflow-hidden text-ellipsis whitespace-nowrap mt-1 text-blue-200/60">
          {link.description}
        </div>
      )}
    </div>
  );
}
