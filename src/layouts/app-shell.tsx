import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Outlet, useLocation } from "react-router-dom"

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Sidebar, SidebarContent } from "@/layouts/sidebar"
import { Topbar } from "@/layouts/topbar"
import { cn } from "@/lib/utils"

const COLLAPSE_KEY = "dayflow:sidebar-collapsed"

export function AppShell() {
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const [collapsed, setCollapsed] = React.useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(COLLAPSE_KEY) === "1"
  )
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0")
      return next
    })
  }

  return (
    <div className="min-h-screen bg-df-bg xl:p-6">
      <div
        className={cn(
          "mx-auto flex min-h-screen max-w-[1440px] overflow-hidden bg-df-surface",
          "xl:min-h-[calc(100vh-3rem)] xl:rounded-[28px] xl:shadow-df-lg xl:ring-1 xl:ring-border"
        )}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[264px] p-0 sm:max-w-[264px]" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenMobileSidebar={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-df-bg px-4 py-6 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}
