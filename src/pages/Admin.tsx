import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authApi, User } from '@/lib/auth';
import { ordersApi, Order } from '@/lib/orders';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authApi.verify();
      setUser(currentUser);
      
      if (currentUser.role !== 'admin') {
        toast({ title: 'Доступ запрещён', variant: 'destructive' });
        navigate('/');
        return;
      }
      
      await loadOrders();
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await ordersApi.getOrders();
      setOrders(data);
    } catch (error) {
      toast({ title: 'Ошибка загрузки заказов', variant: 'destructive' });
    }
  };

  const updateStatus = async (orderId: number, status: string) => {
    try {
      await ordersApi.updateOrderStatus(orderId, status);
      toast({ title: 'Статус обновлён' });
      await loadOrders();
    } catch (error) {
      toast({ title: 'Ошибка обновления', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Ожидает', variant: 'secondary' },
      processing: { label: 'Обработка', variant: 'default' },
      shipped: { label: 'Отправлен', variant: 'outline' },
      delivered: { label: 'Доставлен', variant: 'default' },
      cancelled: { label: 'Отменён', variant: 'destructive' }
    };
    
    const { label, variant } = variants[status] || variants.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-gray">
      <header className="bg-white border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-serif">Админ-панель MAISON</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                <Icon name="Home" size={16} className="mr-2" />
                На сайт
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  authApi.logout();
                  navigate('/');
                }}
              >
                <Icon name="LogOut" size={16} className="mr-2" />
                Выход
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Заказы</TabsTrigger>
            <TabsTrigger value="stats">Статистика</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Все заказы ({orders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Заказов пока нет</p>
                  ) : (
                    orders.map((order: any) => (
                      <Card key={order.id} className="border-2">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-medium text-lg">Заказ #{order.id}</h3>
                              <p className="text-sm text-muted-foreground">
                                {order.user_name || 'Гость'} • {order.user_email || 'Без email'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(order.created_at).toLocaleString('ru-RU')}
                              </p>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(order.status)}
                              <p className="text-lg font-serif mt-2">
                                {order.total_amount?.toLocaleString('ru-RU')} ₽
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <h4 className="font-medium text-sm">Товары:</h4>
                            {order.items?.map((item: any, idx: number) => (
                              <div key={idx} className="text-sm text-muted-foreground">
                                • {item.product_name} ({item.selected_size}) x{item.quantity} - {item.product_price} ₽
                              </div>
                            ))}
                          </div>

                          {order.delivery_address && (
                            <div className="mb-4">
                              <h4 className="font-medium text-sm">Доставка:</h4>
                              <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                              <p className="text-sm text-muted-foreground">{order.delivery_phone}</p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(order.id, 'processing')}
                              disabled={order.status === 'processing'}
                            >
                              В обработку
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(order.id, 'shipped')}
                              disabled={order.status === 'shipped'}
                            >
                              Отправлен
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(order.id, 'delivered')}
                              disabled={order.status === 'delivered'}
                            >
                              Доставлен
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatus(order.id, 'cancelled')}
                              disabled={order.status === 'cancelled'}
                            >
                              Отменить
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Всего заказов</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-serif">{orders.length}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Активные</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-serif">
                    {orders.filter((o: any) => ['pending', 'processing', 'shipped'].includes(o.status)).length}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Выручка</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-serif">
                    {orders
                      .filter((o: any) => o.status === 'delivered')
                      .reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0)
                      .toLocaleString('ru-RU')} ₽
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
