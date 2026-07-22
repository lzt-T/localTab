import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      {...props}
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-400" />,
        info: <InfoIcon className="size-4 text-blue-400" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-400" />,
        error: <OctagonXIcon className="size-4 text-red-400" />,
        loading: <Loader2Icon className="size-4 animate-spin text-white/70" />,
      }}
      toastOptions={{
        classNames: {
          toast: "backdrop-blur-2xl shadow-xl shadow-black/30",
          title: "font-medium text-white/90",
          description: "text-white/60",
          success: "!border-emerald-400/25",
          info: "!border-blue-400/25",
          warning: "!border-amber-400/25",
          error: "!border-red-400/25",
        },
      }}
      style={
        {
          "--normal-bg": "rgba(32, 34, 38, 0.92)",
          "--normal-text": "rgba(255, 255, 255, 0.9)",
          "--normal-border": "rgba(255, 255, 255, 0.14)",
          "--border-radius": "0.75rem",
        } as React.CSSProperties
      }
    />
  )
}

export { Toaster }
