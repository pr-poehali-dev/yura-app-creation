import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authApi, User } from '@/lib/auth';
import { ordersApi, Order } from '@/lib/orders';
import { TelegramLink } from '@/components/TelegramLink';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authApi.verify();
      setUser(currentUser);
      await loadOrders(currentUser.id);
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (userId: number) => {
    try {
      const data = await ordersApi.getOrders(userId);
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
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
            <h1 className="text-2xl font-serif">Личный кабинет</h1>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <Icon name="Home" size={16} className="mr-2" />
              На главную
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Профиль</TabsTrigger>
            <TabsTrigger value="orders">Мои заказы</TabsTrigger>
            <TabsTrigger value="telegram">Telegram</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Информация о профиле</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Имя</p>
                  <p className="font-medium">{user?.full_name || 'Не указано'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Роль</p>
                  <p className="font-medium capitalize">{user?.role}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">История заказов ({orders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">У вас пока нет заказов</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
                      <Card key={order.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-medium">Заказ #{order.id}</h3>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleString('ru-RU')}
                              </p>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(order.status)}
                              <p className="text-lg font-serif mt-1">
                                {order.total_amount?.toLocaleString('ru-RU')} ₽
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            {order.items?.map((item: any, idx: number) => (
                              <div key={idx} className="text-sm text-muted-foreground">
                                • {item.product_name} ({item.selected_size}) x{item.quantity}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="telegram">
            <TelegramLink />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
