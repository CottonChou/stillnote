import { createContext, useContext } from "react";
import { ChevronsRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const MEMO_LIST_PANE_ID = "stillnote-memo-list-pane";

export type WorkspaceMemoListContextValue = {
  collapsed: boolean;
  onExpand: () => void;
  shortcutLabel?: string;
};

export const WorkspaceMemoListContext = createContext<WorkspaceMemoListContextValue>({
  collapsed: false,
  onExpand: () => {},
});

export const useWorkspaceMemoList = () => useContext(WorkspaceMemoListContext);

export const MemoListExpandButton = ({
  className,
}: {
  className?: string;
}) => {
  const { collapsed, onExpand, shortcutLabel } = useWorkspaceMemoList();
  const { t } = useTranslation();

  if (!collapsed) {
    return null;
  }

  const label = t("memoList.expandList");
  const tooltipLabel = shortcutLabel ? `${label} (${shortcutLabel})` : label;

  return (
    <div className={cn("hidden shrink-0 items-center lg:flex", className)}>
      <TooltipProvider delayDuration={0} skipDelayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              aria-label={label}
              aria-expanded={false}
              aria-controls={MEMO_LIST_PANE_ID}
              onClick={onExpand}
            >
              <ChevronsRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{tooltipLabel}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export const EmptyMemoListRestoreAction = () => {
  const { collapsed, onExpand } = useWorkspaceMemoList();
  const { t } = useTranslation();

  if (!collapsed) {
    return null;
  }

  return (
    <div className="mt-4 hidden lg:block">
      <Button type="button" variant="outline" size="sm" onClick={onExpand}>
        <ChevronsRight className="mr-1.5 h-4 w-4" aria-hidden="true" />
        {t("memoList.expandList")}
      </Button>
    </div>
  );
};
