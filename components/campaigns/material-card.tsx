'use client'

import { useState } from 'react'
import { CampaignMaterial } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { 
  FileText, 
  Download, 
  Eye, 
  MoreVertical, 
  Trash2,
  FileImage,
  FileSpreadsheet,
  Presentation,
  File,
  Calendar,
  User,
  ExternalLink,
} from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface MaterialCardProps {
  material: CampaignMaterial
  canManage: boolean
  onDelete: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  geral: 'Geral',
  precos: 'Preços',
  promocoes: 'Promoções',
  formacao: 'Formação',
  scripts: 'Scripts',
  marketing: 'Marketing',
  contratos: 'Contratos',
}

const CATEGORY_COLORS: Record<string, string> = {
  geral: 'bg-gray-500/20 text-gray-700 dark:text-gray-300',
  precos: 'bg-green-500/20 text-green-700 dark:text-green-300',
  promocoes: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  formacao: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  scripts: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  marketing: 'bg-pink-500/20 text-pink-700 dark:text-pink-300',
  contratos: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
}

function getFileIcon(fileType: string) {
  if (fileType.includes('pdf')) return FileText
  if (fileType.includes('image')) return FileImage
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return FileSpreadsheet
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return Presentation
  return File
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return 'N/A'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function MaterialCard({ material, canManage, onDelete }: MaterialCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const FileIcon = getFileIcon(material.file_type)
  const isPdf = material.file_type.includes('pdf')
  const isImage = material.file_type.includes('image')
  const canPreview = isPdf || isImage

  const handleDownload = async () => {
    // Track download
    await fetch('/api/campaigns/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materialId: material.id }),
    })

    // Open file in new tab or download
    window.open(material.file_url, '_blank')
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch('/api/campaigns/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId: material.id }),
      })

      if (!response.ok) {
        throw new Error('Erro ao eliminar')
      }

      toast.success('Material eliminado com sucesso')
      onDelete()
    } catch (error) {
      toast.error('Erro ao eliminar material')
    } finally {
      setDeleting(false)
      setDeleteConfirmOpen(false)
    }
  }

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                'p-2 rounded-lg shrink-0',
                isPdf ? 'bg-red-500/10 text-red-600' :
                isImage ? 'bg-blue-500/10 text-blue-600' :
                'bg-muted text-muted-foreground'
              )}>
                <FileIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base truncate">{material.title}</CardTitle>
                <CardDescription className="text-xs truncate">
                  {material.file_name}
                </CardDescription>
              </div>
            </div>
            
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setDeleteConfirmOpen(true)} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {material.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {material.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className={cn('text-xs', CATEGORY_COLORS[material.category])}>
              {CATEGORY_LABELS[material.category] || material.category}
            </Badge>
            <span>{formatFileSize(material.file_size)}</span>
            <span>•</span>
            <span>{material.download_count} downloads</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(material.created_at), "d MMM yyyy", { locale: pt })}
            </div>
            {material.uploader && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {material.uploader.full_name}
              </div>
            )}
          </div>
          
          <div className="flex gap-2 pt-2">
            {canPreview && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Pré-visualizar
              </Button>
            )}
            <Button 
              variant={canPreview ? "default" : "outline"}
              size="sm" 
              className="flex-1"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-1" />
              Descarregar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileIcon className="w-5 h-5" />
              {material.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-lg bg-muted">
            {isPdf ? (
              <iframe
                src={`${material.file_url}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0"
                title={material.title}
              />
            ) : isImage ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={material.file_url}
                  alt={material.title}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : null}
          </div>
          <div className="shrink-0 flex justify-between items-center pt-4">
            <Button variant="outline" size="sm" asChild>
              <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir em nova aba
              </a>
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Descarregar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar material?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar &quot;{material.title}&quot;? 
              Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'A eliminar...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
