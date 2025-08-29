import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, AlertCircle, DollarSign, MapPin, Clock, Send, AlertTriangle } from "lucide-react";
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

  // Get team attendance status
  const { data: teamAttendance, isLoading: loadingAttendance } = useQuery({
    queryKey: ["/api/admin/team-attendance"],
  });

  // Get users not clocked in
  const { data: usersNotClocked, isLoading: loadingNotClocked } = useQuery({
    queryKey: ["/api/admin/users-not-clocked"],
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

  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async (data: { userIds: string[], message: string }) => {
      const response = await apiRequest("POST", "/api/admin/send-reminder", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-not-clocked"] });
      toast({
        title: "Notifications envoyées",
        description: data.message,
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

  const handleSendReminder = () => {
    if (!usersNotClocked || usersNotClocked.length === 0) {
      toast({
        title: "Aucun utilisateur",
        description: "Tous les membres ont déjà pointé aujourd'hui",
        variant: "destructive",
      });
      return;
    }

    const userIds = usersNotClocked.map((user: any) => user.id);
    const message = "N'oubliez pas de pointer votre présence pour aujourd'hui. Merci de vous connecter à l'application Geo DaTeam.";
    
    sendReminderMutation.mutate({ userIds, message });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'absent': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'En service';
      case 'completed': return 'Terminé';
      case 'absent': return 'Absent';
      default: return 'Inconnu';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCoordinates = (lat: string, lng: string) => {
    if (!lat || !lng) return 'Non disponible';
    return `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
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
                  {loadingStats ? "..." : `${stats?.totalAmount?.toFixed(2) || "0.00"} MAD`}
                </p>
              </div>
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Team Attendance Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>État de présence de l'équipe</CardTitle>
            <div className="flex items-center space-x-2">
              {usersNotClocked && usersNotClocked.length > 0 && (
                <div className="flex items-center space-x-1 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">{usersNotClocked.length} non-pointé(s)</span>
                </div>
              )}
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleSendReminder}
                disabled={sendReminderMutation.isPending || !usersNotClocked || usersNotClocked.length === 0}
                data-testid="button-send-reminder"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendReminderMutation.isPending ? "Envoi..." : "Envoyer rappel"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingAttendance ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {teamAttendance?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun membre d'équipe
                </p>
              ) : (
                teamAttendance?.map((member: any) => (
                  <div 
                    key={member.id} 
                    className={`border rounded-lg p-4 ${
                      member.status === 'absent' ? 'border-red-200 bg-red-50' : 'border-border'
                    }`}
                    data-testid={`team-member-${member.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-secondary-foreground">
                            {getInitials(member.name)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                          {getStatusText(member.status)}
                        </span>
                        {member.status === 'absent' && (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                          <Clock className="h-3 w-3" />
                          <span>Pointage</span>
                        </div>
                        <p className="text-foreground">
                          {member.attendance ? (
                            <>
                              Arrivée: {formatTime(member.attendance.clockIn)}
                              {member.attendance.clockOut && (
                                <><br />Départ: {formatTime(member.attendance.clockOut)}</>
                              )}
                            </>
                          ) : (
                            <span className="text-red-600 font-medium">Non pointé</span>
                          )}
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                          <MapPin className="h-3 w-3" />
                          <span>Position</span>
                        </div>
                        <p className="text-foreground">
                          {member.attendance ? (
                            <>
                              {formatCoordinates(member.attendance.latitude, member.attendance.longitude)}
                              <br />
                              <span className="text-xs text-muted-foreground">
                                {member.attendance.location || 'Position GPS'}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Non disponible</span>
                          )}
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-1 text-muted-foreground mb-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Durée</span>
                        </div>
                        <p className="text-foreground">
                          {member.attendance ? (
                            (() => {
                              const start = new Date(member.attendance.clockIn);
                              const end = member.attendance.clockOut ? new Date(member.attendance.clockOut) : new Date();
                              const diff = end.getTime() - start.getTime();
                              const hours = Math.floor(diff / (1000 * 60 * 60));
                              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                              return `${hours}h ${minutes}min`;
                            })()
                          ) : (
                            <span className="text-muted-foreground">0h 0min</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
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
                        {parseFloat(expense.amount).toFixed(2)} MAD
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
