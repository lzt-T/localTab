import React, { useCallback } from "react";
import { EllipsisVertical } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Icon from "../Icon";
import { Button } from "@/components/ui/button";

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
}

export default function Index({
  link,
  handleEditClick,
  handleDeleteClick,
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

  return (
    <div className="glass-style-border rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl  hover:-translate-y-2">
      {link.id && (handleEditClick || handleDeleteClick) && (
        <div className="absolute top-4 right-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <EllipsisVertical size={18} />
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="px-6 py-4 bg-[#2E2E2E] flex items-center gap-2"
              arrowClassName="fill-[#2E2E2E] bg-[#2E2E2E]"
              onPointerDownOutside={(e) => e.preventDefault()}
            >
              <div className="flex flex-col gap-2">
                {handleEditClick && (
                  <Button
                    variant="link"
                    className="text-white  hover:no-underline focus:no-underline cursor-pointer"
                    onClick={onEditClick}
                  >
                    编辑
                  </Button>
                )}
                {handleDeleteClick && (
                  <Button
                    variant="link"
                    className="text-white  hover:no-underline focus:no-underline cursor-pointer"
                    onClick={onDeleteClick}
                  >
                    删除
                  </Button>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      <div className="mb-2 flex items-center justify-center">
        <Icon name={link.icon} size={32} />
      </div>
      <div className="text-lg font-semibold mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {link.title}
      </div>
      <div className="text-sm opacity-80 overflow-hidden text-ellipsis whitespace-nowrap">
        {link.description}
      </div>
    </div>
  );
}
