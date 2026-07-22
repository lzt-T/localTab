import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  changeLanguageMode,
  getLanguageMode,
  type LanguageMode,
} from "@/i18n";

const LANGUAGE_OPTIONS: Array<{
  value: LanguageMode;
  labelKey: string;
}> = [
  { value: "auto", labelKey: "settings.languageModes.auto" },
  { value: "zh-CN", labelKey: "settings.languageModes.zhCN" },
  { value: "en-US", labelKey: "settings.languageModes.enUS" },
];

export default function LanguageSettings() {
  const { t } = useTranslation();
  const [languageMode, setLanguageMode] = useState<LanguageMode>(
    getLanguageMode
  );

  const handleLanguageChange = (value: string) => {
    const nextLanguageMode = value as LanguageMode;
    setLanguageMode(nextLanguageMode);
    void changeLanguageMode(nextLanguageMode);
  };

  return (
    <div className="max-w-md space-y-3">
      <div className="space-y-1">
        <Label htmlFor="display-language" className="text-white/80">
          {t("settings.languageLabel")}
        </Label>
        <p className="text-sm text-white/55">
          {t("settings.languageDescription")}
        </p>
      </div>
      <Select value={languageMode} onValueChange={handleLanguageChange}>
        <SelectTrigger
          id="display-language"
          className="w-full cursor-pointer border-white/15 bg-white/[0.06] text-white focus-visible:border-blue-300/60 focus-visible:ring-blue-300/20 [&_svg]:text-white/50"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-white/15 bg-[rgba(32,34,38,0.98)] text-white shadow-xl backdrop-blur-2xl">
          {LANGUAGE_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="cursor-pointer focus:bg-white/10 focus:text-white"
            >
              {t(option.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
