'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type AlertDialogContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}
const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(null)

function useAlertDialog() {
  const ctx = React.useContext(AlertDialogContext)
  if (!ctx) throw new Error('AlertDialog components must be used within <AlertDialog>')
  return ctx
}

const AlertDialog: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  )
}

const AlertDialogTrigger: React.FC<React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }> = ({ children, ...props }) => {
  const { setOpen } = useAlertDialog()
  return (
    <div {...props} onClick={() => setOpen(true)}>
      {children}
    </div>
  )
}

const AlertDialogContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  const { open, setOpen } = useAlertDialog()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={cn('w-full max-w-lg rounded-md bg-background p-6 shadow-lg', className)} {...props}>
        {children}
      </div>
      <div className="fixed inset-0" onClick={() => setOpen(false)} />
    </div>
  )
}

const AlertDialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('mb-4', className)} {...props} />
)

const AlertDialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('mt-4 flex justify-end gap-2', className)} {...props} />
)

const AlertDialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2 className={cn('text-lg font-semibold', className)} {...props} />
)

const AlertDialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...props} />
)

const AlertDialogAction: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => {
  const { setOpen } = useAlertDialog()
  return (
    <button
      {...props}
      onClick={e => {
        props.onClick?.(e)
        setOpen(false)
      }}
      className={cn('inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow', props.className)}
    >
      {children}
    </button>
  )
}

const AlertDialogCancel: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => {
  const { setOpen } = useAlertDialog()
  return (
    <button
      {...props}
      onClick={e => {
        props.onClick?.(e)
        setOpen(false)
      }}
      className={cn('inline-flex h-10 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm', props.className)}
    >
      {children}
    </button>
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
