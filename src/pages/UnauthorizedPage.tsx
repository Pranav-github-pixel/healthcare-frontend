import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 font-mono">
      <Card className="max-w-md w-full text-center border-border/80 shadow-soft dark:shadow-soft-dark">
        <CardHeader className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-2">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <Badge variant="outline" className="text-red-600 border-red-500/30">
            Access Restricted
          </Badge>
          <CardTitle className="text-2xl font-serif">403 Unauthorized</CardTitle>
          <CardDescription>
            You do not possess the required role permissions to view this clinical partition.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Link
            to="/login"
            className={cn(buttonVariants({ variant: "default" }), "w-full gap-2")}
          >
            <ArrowLeft className="w-4 h-4" /> Return to Safe Portal
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
