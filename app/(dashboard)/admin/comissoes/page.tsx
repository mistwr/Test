'use client'

import { COMMISSION_TIERS, formatCurrency, TOTAL_BASE, BASE_SALARY, TRANSPORT_ALLOWANCE, FOOD_ALLOWANCE_PER_DAY, AVERAGE_WORKING_DAYS } from '@/lib/commissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TierBadge } from '@/components/dashboard/stat-cards'
import { Coins, Info, Euro, Zap, Tv, Smartphone, Phone } from 'lucide-react'

export default function AdminComissoesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
          <Coins className="h-8 w-8 text-primary" />
          Tabela de Comissoes
        </h1>
        <p className="text-muted-foreground">
          Estrutura de comissoes DIGI - O patamar depende APENAS das fibras
        </p>
      </div>

      {/* Important Rule */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Regra Fundamental</p>
            <p className="text-sm text-muted-foreground mt-1">
              O patamar e definido <strong>apenas pelas fibras</strong>. TVs, moveis e fixos pagam individualmente 
              mas nao alteram o patamar. Mesmo com 100 moveis, se o vendedor tiver 10 fibras, esta no patamar Bronze (6-10 fibras).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Base Salary Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-green-500" />
            Base Fixa Mensal
          </CardTitle>
          <CardDescription>
            Valores fixos pagos todos os meses, independente das vendas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Salario Base</p>
              <p className="text-2xl font-bold">{formatCurrency(BASE_SALARY)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Subsidio Transporte</p>
              <p className="text-2xl font-bold">{formatCurrency(TRANSPORT_ALLOWANCE)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Alimentacao ({AVERAGE_WORKING_DAYS} dias)</p>
              <p className="text-2xl font-bold">{formatCurrency(FOOD_ALLOWANCE_PER_DAY * AVERAGE_WORKING_DAYS)}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(FOOD_ALLOWANCE_PER_DAY)}/dia</p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-sm text-muted-foreground">Total Base Fixa</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(TOTAL_BASE)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>Patamares de Comissao</CardTitle>
          <CardDescription>
            O valor da fibra aumenta conforme o numero de fibras vendidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Patamar</th>
                  <th className="text-left py-3 px-4 font-semibold">Fibras Necessarias</th>
                  <th className="text-right py-3 px-4 font-semibold">
                    <span className="flex items-center justify-end gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Fibra
                    </span>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold">
                    <span className="flex items-center justify-end gap-2">
                      <Tv className="h-4 w-4" />
                      TV
                    </span>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold">
                    <span className="flex items-center justify-end gap-2">
                      <Smartphone className="h-4 w-4" />
                      Movel
                    </span>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold">
                    <span className="flex items-center justify-end gap-2">
                      <Phone className="h-4 w-4" />
                      Fixo
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMMISSION_TIERS.map((tier, index) => (
                  <tr key={tier.tierName} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4">
                      <TierBadge tierName={tier.tierName} />
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium">
                        {tier.minFibers} - {tier.maxFibers || '∞'} fibras
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(tier.fiberValue)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-medium">
                      {formatCurrency(tier.tvValue)}
                    </td>
                    <td className="py-4 px-4 text-right font-medium">
                      {formatCurrency(tier.mobileValue)}
                    </td>
                    <td className="py-4 px-4 text-right font-medium">
                      {formatCurrency(tier.fixedValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Example Calculations */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplos de Calculo</CardTitle>
          <CardDescription>
            Como calcular comissoes com diferentes cenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Example 1 */}
          <div className="p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">Exemplo 1: Vendedor com 10 fibras</h4>
            <p className="text-sm text-muted-foreground mb-3">
              10 Fibras + 5 TVs + 20 Moveis + 3 Fixos
            </p>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>Patamar: Bronze (6-10 fibras)</span>
                <span className="font-medium">Fibra = 8€</span>
              </div>
              <div className="flex justify-between">
                <span>10 Fibras x 8€</span>
                <span className="font-medium text-primary">80€</span>
              </div>
              <div className="flex justify-between">
                <span>5 TVs x 6€</span>
                <span className="font-medium">30€</span>
              </div>
              <div className="flex justify-between">
                <span>20 Moveis x 2€</span>
                <span className="font-medium">40€</span>
              </div>
              <div className="flex justify-between">
                <span>3 Fixos x 1€</span>
                <span className="font-medium">3€</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-semibold">Total Comissoes</span>
                <span className="font-bold">153€</span>
              </div>
              <div className="flex justify-between">
                <span>Base Fixa</span>
                <span className="font-medium">{formatCurrency(TOTAL_BASE)}</span>
              </div>
              <div className="flex justify-between bg-green-500/10 p-2 rounded">
                <span className="font-bold">TOTAL MENSAL</span>
                <span className="font-bold text-green-600">{formatCurrency(TOTAL_BASE + 153)}</span>
              </div>
            </div>
          </div>

          {/* Example 2 */}
          <div className="p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">Exemplo 2: Vendedor com 25 fibras</h4>
            <p className="text-sm text-muted-foreground mb-3">
              25 Fibras + 10 TVs + 50 Moveis + 5 Fixos
            </p>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>Patamar: Platina (21-50 fibras)</span>
                <span className="font-medium">Fibra = 20€</span>
              </div>
              <div className="flex justify-between">
                <span>25 Fibras x 20€</span>
                <span className="font-medium text-primary">500€</span>
              </div>
              <div className="flex justify-between">
                <span>10 TVs x 6€</span>
                <span className="font-medium">60€</span>
              </div>
              <div className="flex justify-between">
                <span>50 Moveis x 2€</span>
                <span className="font-medium">100€</span>
              </div>
              <div className="flex justify-between">
                <span>5 Fixos x 1€</span>
                <span className="font-medium">5€</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-semibold">Total Comissoes</span>
                <span className="font-bold">665€</span>
              </div>
              <div className="flex justify-between">
                <span>Base Fixa</span>
                <span className="font-medium">{formatCurrency(TOTAL_BASE)}</span>
              </div>
              <div className="flex justify-between bg-green-500/10 p-2 rounded">
                <span className="font-bold">TOTAL MENSAL</span>
                <span className="font-bold text-green-600">{formatCurrency(TOTAL_BASE + 665)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
