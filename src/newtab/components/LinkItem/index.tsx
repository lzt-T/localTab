import React, { useCallback, useState } from "react";
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
  const [failedExternalIconUrl, setFailedExternalIconUrl] = useState("");
  const isExternalIcon = link.icon.startsWith("http");
  const shouldShowExternalIcon =
    isExternalIcon && failedExternalIconUrl !== link.icon;

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

  const onExternalIconError = () => {
    setFailedExternalIconUrl(link.icon);
  };

  return (
    <div
      className="glass-style-border group/item relative rounded-2xl p-6 shadow-lg shadow-black/10 transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:bg-[rgba(68,70,74,0.66)] hover:border-white/20 hover:shadow-xl hover:shadow-black/20 cursor-pointer h-32 flex flex-col justify-center"
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
        {shouldShowExternalIcon ? (
          <img
            src={link.icon}
            alt={link.title}
            className="w-8 h-8 rounded"
            onError={onExternalIconError}
          />
        ) : (
          <Icon
            name={isExternalIcon ? "link" : link.icon || "link"}
            size={32}
            className="text-blue-200/90"
          />
        )}
      </div>
      <div className="text-base font-medium overflow-hidden text-ellipsis whitespace-nowrap text-white/90 text-center">
        {link.title}
      </div>
      {link.description && (
        <div className="text-xs overflow-hidden text-ellipsis whitespace-nowrap mt-1 text-white/60 text-center">
          {link.description}
        </div>
      )}
    </div>
  );
}
