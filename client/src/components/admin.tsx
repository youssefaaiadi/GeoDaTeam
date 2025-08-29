import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, AlertCircle, DollarSign } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { toast } = useToast();

  // Get admin stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  // Get team members
  const { data: team, isLoading: loadingTeam } = useQuery({
    queryKey: ["/api/admin/team"],
  });

  // Get pending expenses
  const { data: pendingExpenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ["/api/admin/pending-expenses"],
  });

  // Approve expense mutation
  const approveExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const response = await apiRequest("PATCH", `/api/expenses/${expenseId}/status`, {
        status: "approved"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Note de frais approuvée",
        description: "La note de frais a été validée avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject expense mutation
  const rejectExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const response = await apiRequest("PATCH", `/api/expenses/${expenseId}/status`, {
        status: "rejected"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Note de frais refusée",
        description: "La note de frais a été refusée",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Administration</h1>
        <p className="text-muted-foreground">Gestion globale de l'équipe et supervision</p>
      </div>
      
      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total employés</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-employees">
                  {loadingStats ? "..." : stats?.totalEmployees || 0}
                </p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Présents aujourd'hui</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-present-today-admin">
                  {loadingStats ? "..." : stats?.presentToday || 0}
                </p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Frais en attente</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-pending-expenses-admin">
                  {loadingStats ? "..." : stats?.pendingExpenses || 0}
                </p>
              </div>
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Montant total</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-amount">
                  {loadingStats ? "..." : `€${stats?.totalAmount?.toFixed(2) || "0.00"}`}
                </p>
              </div>
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Team Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Status */}
        <Card>
          <CardHeader>
            <CardTitle>État de l'équipe</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTeam ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {team?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Aucun membre d'équipe
                  </p>
                ) : (
                  team?.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-secondary rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-secondary-foreground">
                            {getInitials(member.name)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-600">Hors ligne</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Location Map Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Localisation équipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <p className="text-sm">Carte de localisation</p>
                <p className="text-xs">Positions en temps réel</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Pending Expenses Review */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notes de frais à valider</CardTitle>
            <Button variant="secondary" size="sm">
              Tout valider
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingExpenses ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {pendingExpenses?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune note de frais en attente
                </p>
              ) : (
                pendingExpenses?.map((expense: any) => (
                  <div 
                    key={expense.id} 
                    className="border border-border rounded-lg p-4"
                    data-testid={`pending-expense-${expense.id}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-medium text-foreground">
                          {expense.user?.name || "Utilisateur inconnu"}
                        </span>
                        <div className="text-sm text-muted-foreground">
                          {expense.category} - {new Date(expense.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <span className="font-semibold text-foreground">
                        €{parseFloat(expense.amount).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {expense.description}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => approveExpenseMutation.mutate(expense.id)}
                        disabled={approveExpenseMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid={`button-approve-${expense.id}`}
                      >
                        Valider
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectExpenseMutation.mutate(expense.id)}
                        disabled={rejectExpenseMutation.isPending}
                        data-testid={`button-reject-${expense.id}`}
                      >
                        Refuser
                      </Button>
                      {expense.receiptPath && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(`/api/expenses/${expense.id}/receipt`, '_blank')}
                          data-testid={`button-view-receipt-admin-${expense.id}`}
                        >
                          Voir
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
