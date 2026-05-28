'use client'

import { useState } from 'react'
import { ExternalLink, Maximize2, Minimize2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const DEALERCARE_URL = 'https://dealercare.digi.pt/dashboard'

export default function DealerCarePage() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showEmbed, setShowEmbed] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    const iframe = document.getElementById('dealercare-iframe') as HTMLIFrameElement
    if (iframe) {
      iframe.src = iframe.src
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (!showEmbed) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <ExternalLink className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Portal DealerCare DIGI</CardTitle>
            <CardDescription className="text-base">
              Acede ao portal oficial de vendedores DIGI diretamente aqui.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">O que podes fazer no DealerCare:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Consultar vendas e comissoes</li>
                <li>Registar novas vendas</li>
                <li>Verificar estado de instalacoes</li>
                <li>Aceder a documentacao oficial</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => setShowEmbed(true)}
              >
                <Maximize2 className="mr-2 h-5 w-5" />
                Abrir Portal Embutido
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full"
                asChild
              >
                <a href={DEALERCARE_URL} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Abrir em Nova Janela
                </a>
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              Nota: Algumas funcionalidades podem requerer login no portal DealerCare.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'p-4 md:p-6'}`}>
      {/* Header Controls */}
      <div className={`flex items-center justify-between mb-4 ${isFullscreen ? 'px-4 pt-4' : ''}`}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Portal DealerCare</h1>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            DIGI Oficial
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEmbed(false)}
          >
            Voltar
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            title="Atualizar"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Sair de ecra inteiro' : 'Ecra inteiro'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            asChild
            title="Abrir em nova janela"
          >
            <a href={DEALERCARE_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      {/* Iframe Container */}
      <div 
        className={`
          relative rounded-lg border bg-card overflow-hidden
          ${isFullscreen ? 'mx-4 mb-4' : ''}
        `}
        style={{ 
          height: isFullscreen ? 'calc(100vh - 100px)' : 'calc(100vh - 180px)',
          minHeight: '500px'
        }}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">A carregar DealerCare...</p>
            </div>
          </div>
        )}

        {/* Iframe */}
        <iframe
          id="dealercare-iframe"
          src={DEALERCARE_URL}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          title="Portal DealerCare DIGI"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Footer Info */}
      <div className={`mt-2 text-xs text-muted-foreground text-center ${isFullscreen ? 'px-4 pb-2' : ''}`}>
        Portal oficial DIGI - dealercare.digi.pt
      </div>
    </div>
  )
}
