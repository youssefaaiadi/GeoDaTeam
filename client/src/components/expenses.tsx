import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Clock, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Expenses() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: "",
    category: "",
    description: "",
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Get expenses
  const { data: expenses, isLoading } = useQuery({
    queryKey: ["/api/expenses"],
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/expenses", {
        method: "POST",
        body: data,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: "",
        category: "",
        description: "",
      });
      setReceiptFile(null);
      toast({
        title: "Note de frais créée",
        description: "Votre note de frais a été soumise avec succès",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.amount || !formData.description) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const data = new FormData();
    data.append("date", formData.date);
    data.append("amount", formData.amount);
    data.append("category", formData.category);
    data.append("description", formData.description);
    
    if (receiptFile) {
      data.append("receipt", receiptFile);
    }

    createExpenseMutation.mutate(data);
  };

  // Calculate stats
  const stats = expenses?.reduce(
    (acc: any, expense: any) => {
      const amount = parseFloat(expense.amount);
      acc.thisMonth += amount;
      
      switch (expense.status) {
        case "pending":
          acc.pending += amount;
          break;
        case "approved":
          acc.approved += amount;
          break;
      }
      
      return acc;
    },
    { thisMonth: 0, pending: 0, approved: 0 }
  ) || { thisMonth: 0, pending: 0, approved: 0 };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Validée</Badge>;
      case "rejected":
        return <Badge variant="destructive">Refusée</Badge>;
      default:
        return <Badge variant="secondary">En attente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Notes de frais</h1>
        <p className="text-muted-foreground">Gestion et suivi de vos frais professionnels</p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ce mois</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-expenses-this-month">
                  €{stats.thisMonth.toFixed(2)}
                </p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-expenses-pending">
                  €{stats.pending.toFixed(2)}
                </p>
              </div>
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Validées</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-expenses-approved">
                  €{stats.approved.toFixed(2)}
                </p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Add Expense Form */}
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle note de frais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="expense-date">Date</Label>
              <Input
                id="expense-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                data-testid="input-expense-date"
              />
            </div>
            
            <div>
              <Label htmlFor="expense-amount">Montant (€)</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                data-testid="input-expense-amount"
              />
            </div>
            
            <div>
              <Label htmlFor="expense-category">Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger data-testid="select-expense-category">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="carburant">Carburant</SelectItem>
                  <SelectItem value="repas">Repas</SelectItem>
                  <SelectItem value="hebergement">Hébergement</SelectItem>
                  <SelectItem value="equipement">Équipement</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="expense-receipt">Justificatif</Label>
              <Input
                id="expense-receipt"
                type="file"
                accept="image/*"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                data-testid="input-expense-receipt"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="expense-description">Description</Label>
              <Textarea
                id="expense-description"
                rows={3}
                placeholder="Décrivez la dépense..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="textarea-expense-description"
              />
            </div>
            
            <div className="md:col-span-2">
              <Button 
                type="submit" 
                disabled={createExpenseMutation.isPending}
                data-testid="button-submit-expense"
              >
                {createExpenseMutation.isPending ? "Soumission..." : "Soumettre la note de frais"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Mes notes de frais</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {expenses?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune note de frais
                </p>
              ) : (
                expenses?.map((expense: any) => (
                  <div 
                    key={expense.id} 
                    className="border border-border rounded-lg p-4"
                    data-testid={`expense-${expense.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium text-foreground capitalize">
                          {expense.category}
                        </span>
                        <div className="text-sm text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">
                          €{parseFloat(expense.amount).toFixed(2)}
                        </div>
                        {getStatusBadge(expense.status)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {expense.description}
                    </p>
                    <div className="flex justify-between items-center">
                      {expense.receiptPath && (
                        <button 
                          className="text-sm text-primary hover:text-primary/80"
                          onClick={() => window.open(`/api/expenses/${expense.id}/receipt`, '_blank')}
                          data-testid={`button-view-receipt-${expense.id}`}
                        >
                          Voir reçu
                        </button>
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
