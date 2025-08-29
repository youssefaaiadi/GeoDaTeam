import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Attendance() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { toast } = useToast();

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
          toast({
            title: "Géolocalisation",
            description: "Impossible d'obtenir votre position",
            variant: "destructive",
          });
        }
      );
    }
  }, [toast]);

  // Get today's attendance
  const { data: todayAttendance, isLoading: loadingToday } = useQuery({
    queryKey: ["/api/attendance/today"],
  });

  // Get attendance records
  const { data: attendanceRecords, isLoading: loadingRecords } = useQuery({
    queryKey: ["/api/attendance"],
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: async () => {
      if (!location) {
        throw new Error("Position GPS non disponible");
      }
      
      const response = await apiRequest("POST", "/api/attendance/clock-in", {
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        location: "Position GPS",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({
        title: "Pointage enregistré",
        description: "Votre présence a été enregistrée avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur de pointage",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/attendance/clock-out", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      toast({
        title: "Fin de journée enregistrée",
        description: "Votre départ a été enregistré avec succès",
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

  const handleClockAction = () => {
    if (todayAttendance && !todayAttendance.clockOut) {
      clockOutMutation.mutate();
    } else if (!todayAttendance) {
      clockInMutation.mutate();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateWorkingTime = (clockIn: string, clockOut?: string) => {
    const start = new Date(clockIn);
    const end = clockOut ? new Date(clockOut) : new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  const getButtonText = () => {
    if (todayAttendance) {
      return todayAttendance.clockOut ? "Déjà pointé aujourd'hui" : "Pointer la sortie";
    }
    return "Pointer la présence";
  };

  const isButtonDisabled = () => {
    return (todayAttendance && todayAttendance.clockOut) || 
           clockInMutation.isPending || 
           clockOutMutation.isPending ||
           !location;
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gestion de présence</h1>
        <p className="text-muted-foreground">Pointage et suivi de présence en temps réel</p>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clock In/Out Card */}
        <Card>
          <CardHeader>
            <CardTitle>Pointage rapide</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-3xl font-bold text-primary" data-testid="text-current-time">
              {formatTime(currentTime)}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(currentTime)}
            </p>
            
            <Button
              onClick={handleClockAction}
              disabled={isButtonDisabled()}
              className="w-full"
              data-testid="button-clock-action"
            >
              <Clock className="h-5 w-5 mr-2" />
              {clockInMutation.isPending || clockOutMutation.isPending 
                ? "Enregistrement..." 
                : getButtonText()
              }
            </Button>
            
            <p className="text-xs text-muted-foreground flex items-center justify-center">
              <MapPin className="h-4 w-4 mr-1" />
              {location ? "Géolocalisation activée" : "Géolocalisation en cours..."}
            </p>
          </CardContent>
        </Card>
        
        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Statut actuel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingToday ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dernier pointage</span>
                  <span className="text-sm font-medium text-foreground" data-testid="text-last-clock-in">
                    {todayAttendance 
                      ? new Date(todayAttendance.clockIn).toLocaleTimeString('fr-FR').slice(0, 5)
                      : "Aucun"
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Temps de travail</span>
                  <span className="text-sm font-medium text-foreground" data-testid="text-working-time">
                    {todayAttendance 
                      ? calculateWorkingTime(todayAttendance.clockIn, todayAttendance.clockOut)
                      : "0h 0min"
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Localisation</span>
                  <span className="text-sm font-medium text-foreground" data-testid="text-current-location">
                    {todayAttendance?.location || "Non définie"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${
                    todayAttendance && !todayAttendance.clockOut ? "bg-green-500" : "bg-gray-400"
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    todayAttendance && !todayAttendance.clockOut ? "text-green-600" : "text-gray-600"
                  }`}>
                    {todayAttendance && !todayAttendance.clockOut ? "En service" : "Hors service"}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique de présence</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRecords ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {attendanceRecords?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun enregistrement de présence
                </p>
              ) : (
                attendanceRecords?.map((record: any) => (
                  <div 
                    key={record.id} 
                    className="border border-border rounded-lg p-4"
                    data-testid={`attendance-record-${record.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-foreground">
                        {new Date(record.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </span>
                      <Badge variant={record.clockOut ? "default" : "secondary"}>
                        {record.clockOut ? "Présent" : "En cours"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        Arrivée: {new Date(record.clockIn).toLocaleTimeString('fr-FR').slice(0, 5)}
                        {record.clockOut && 
                          ` - Départ: ${new Date(record.clockOut).toLocaleTimeString('fr-FR').slice(0, 5)}`
                        }
                      </div>
                      <div>
                        Durée: {calculateWorkingTime(record.clockIn, record.clockOut)}
                      </div>
                      {record.location && (
                        <div>Lieu: {record.location}</div>
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
