'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  Zap,
  LayoutDashboard,
  Users,
  UserCircle,
  Trophy,
  Target,
  Calculator,
  BookOpen,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Bell,
  TrendingUp,
  Building2,
  ClipboardList,
  Coins,
  Megaphone,
  Globe,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  roles?: ('ADMIN' | 'PARCEIRO' | 'CHEFE_EQUIPA' | 'VENDEDOR')[]
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Equipas', href: '/admin/equipas', icon: Building2, roles: ['ADMIN'] },
  { title: 'Vendedores', href: '/admin/vendedores', icon: Users, roles: ['ADMIN'] },
  { title: 'Resultados', href: '/admin/resultados', icon: ClipboardList, roles: ['ADMIN'] },
  { title: 'Comissoes', href: '/admin/comissoes', icon: Coins, roles: ['ADMIN'] },
  { title: 'Rankings Globais', href: '/admin/rankings', icon: Trophy, roles: ['ADMIN'] },
  { title: 'Gerir Campanhas', href: '/admin/campanhas', icon: Megaphone, roles: ['ADMIN', 'CHEFE_EQUIPA'] },
  { title: 'Minha Equipa', href: '/supervisor/equipa', icon: Users, roles: ['CHEFE_EQUIPA'] },
  { title: 'Registar Vendas', href: '/supervisor/resultados', icon: ClipboardList, roles: ['CHEFE_EQUIPA'] },
  { title: 'DealerCare DIGI', href: '/dealercare', icon: Globe },
  { title: 'Campanhas', href: '/campanhas', icon: Megaphone },
  { title: 'Simulador', href: '/vendedor/simulador', icon: Calculator },
  { title: 'Ranking', href: '/vendedor/ranking', icon: Trophy },
  { title: 'Central de Vendas', href: '/vendedor/central-vendas', icon: BookOpen },
]

function NavLink({ item, collapsed, onClick }: { item: NavItem; collapsed: boolean; onClick?: () => void }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-sidebar-accent',
        isActive 
          ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <item.icon className={cn('h-5 w-5 shrink-0', collapsed ? '' : '')} />
      {!collapsed && <span>{item.title}</span>}
    </Link>
  )
}

export function DashboardSidebar() {
  const { user } = useAuth()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true
    return user && item.roles.includes(user.role)
  })

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sessao terminada')
    router.push('/login')
    router.refresh()
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      'ADMIN': { label: 'Admin', className: 'bg-red-500/20 text-red-300' },
      'PARCEIRO': { label: 'Parceiro', className: 'bg-purple-500/20 text-purple-300' },
      'CHEFE_EQUIPA': { label: 'Chefe', className: 'bg-yellow-500/20 text-yellow-300' },
      'VENDEDOR': { label: 'Vendedor', className: 'bg-blue-500/20 text-blue-300' },
    }
    return badges[role] || badges['VENDEDOR']
  }

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Header */}
      <div className={cn(
        'flex items-center gap-3 border-b border-sidebar-border px-4 py-4',
        collapsed && 'justify-center px-2'
      )}>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Zap className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-sidebar-foreground">DIGI</span>
            <span className="text-xs text-sidebar-foreground/60">Performance</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink 
              key={item.href} 
              item={item} 
              collapsed={collapsed} 
              onClick={onNavigate}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className={cn(
        'border-t border-sidebar-border p-3',
        collapsed && 'flex justify-center'
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                'w-full justify-start gap-3 px-2 py-6 hover:bg-sidebar-accent',
                collapsed && 'w-auto px-2'
              )}
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                  {getInitials(user?.full_name)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && user && (
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[120px]">
                    {user.full_name}
                  </span>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    getRoleBadge(user.role).className
                  )}>
                    {getRoleBadge(user.role).label}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/perfil" className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/perfil" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Definicoes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Collapse Button - Desktop only */}
      <div className="hidden lg:block border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span className="ml-2">Recolher</span>}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-sidebar border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Zap className="w-4 h-4" />
            </div>
            <span className="font-bold text-sidebar-foreground">DIGI Performance</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-sidebar-foreground">
          <Bell className="h-5 w-5" />
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex h-screen sticky top-0 flex-col border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-[70px]' : 'w-64'
      )}>
        <SidebarContent />
      </aside>
    </>
  )
}
