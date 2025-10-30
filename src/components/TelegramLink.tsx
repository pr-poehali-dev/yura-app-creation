import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { telegramApi } from '@/lib/telegram';
import { authApi } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

export const TelegramLink = () => {
  const [telegramId, setTelegramId] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const user = authApi.getUser();

  const handleLink = async () => {
    if (!user) {
      toast({ title: 'Ошибка', description: 'Войдите в систему', variant: 'destructive' });
      return;
    }

    if (!telegramId) {
      toast({ title: 'Ошибка', description: 'Введите Telegram ID', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await telegramApi.linkAccount(user.id, parseInt(telegramId), telegramUsername);
      toast({ 
        title: 'Telegram привязан!', 
        description: 'Теперь вы будете получать уведомления о заказах' 
      });
      
      const updatedUser = { ...user, telegram_id: parseInt(telegramId), telegram_username: telegramUsername };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
    } catch (error) {
      toast({ 
        title: 'Ошибка привязки', 
        description: 'Проверьте данные и попробуйте снова',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (user?.telegram_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Check" size={20} className="text-green-600" />
            Telegram подключен
          </CardTitle>
          <CardDescription>
            Username: @{user.telegram_username || 'не указан'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Вы будете получать уведомления о заказах в Telegram
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="MessageCircle" size={20} />
          Привязать Telegram
        </CardTitle>
        <CardDescription>
          Получайте уведомления о заказах прямо в Telegram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
          <p className="font-medium">Как привязать:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Найдите бота @YourMaisonBot в Telegram</li>
            <li>Отправьте команду /start</li>
            <li>Скопируйте ваш Telegram ID из сообщения бота</li>
            <li>Вставьте ID в поле ниже и нажмите "Привязать"</li>
          </ol>
        </div>

        <div>
          <Label htmlFor="telegram-id">Telegram ID</Label>
          <Input
            id="telegram-id"
            type="number"
            placeholder="123456789"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="telegram-username">Username (необязательно)</Label>
          <Input
            id="telegram-username"
            placeholder="@username"
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value)}
          />
        </div>

        <Button onClick={handleLink} disabled={loading || !telegramId} className="w-full">
          {loading ? 'Привязка...' : 'Привязать Telegram'}
        </Button>
      </CardContent>
    </Card>
  );
};
