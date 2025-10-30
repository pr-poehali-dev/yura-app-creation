import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { AuthDialog } from '@/components/AuthDialog';
import { authApi, User } from '@/lib/auth';
import { ordersApi } from '@/lib/orders';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  sizes: string[];
}

interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
}

const Index = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const savedUser = authApi.getUser();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const products: Product[] = [
    {
      id: 1,
      name: 'Кожаная сумка Premium',
      price: 45000,
      category: 'accessories',
      image: 'https://cdn.poehali.dev/projects/783165fc-2771-4037-aad5-40200d4e8e1f/files/47696c94-918b-4d5b-a260-5cd6a16b4b76.jpg',
      sizes: ['One Size']
    },
    {
      id: 2,
      name: 'Шёлковое платье',
      price: 89000,
      category: 'clothing',
      image: 'https://cdn.poehali.dev/projects/783165fc-2771-4037-aad5-40200d4e8e1f/files/0776c7de-3b5c-48df-b40b-8fcef6ce91fe.jpg',
      sizes: ['XS', 'S', 'M', 'L']
    },
    {
      id: 3,
      name: 'Ювелирное колье',
      price: 125000,
      category: 'jewelry',
      image: 'https://cdn.poehali.dev/projects/783165fc-2771-4037-aad5-40200d4e8e1f/files/b6bf3159-49c5-419b-97ec-a482cfa79626.jpg',
      sizes: ['One Size']
    }
  ];

  const categories = [
    { id: 'all', name: 'Все товары' },
    { id: 'clothing', name: 'Одежда' },
    { id: 'accessories', name: 'Аксессуары' },
    { id: 'jewelry', name: 'Украшения' }
  ];

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1, selectedSize: product.sizes[0] }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      setAuthDialogOpen(true);
      toast({ title: 'Войдите, чтобы оформить заказ' });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const delivery_address = formData.get('address') as string;
    const delivery_phone = formData.get('phone') as string;

    try {
      await ordersApi.createOrder({
        user_id: user.id,
        items: cart,
        total_amount: cartTotal,
        delivery_address,
        delivery_phone,
        payment_method: 'card'
      });

      toast({ title: 'Заказ оформлен!', description: 'Мы свяжемся с вами в ближайшее время' });
      setCart([]);
      setCheckoutOpen(false);
    } catch (error) {
      toast({ title: 'Ошибка оформления', variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    toast({ title: 'Вы вышли из аккаунта' });
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-serif font-bold tracking-tight">MAISON</h1>
            
            <nav className="hidden md:flex items-center gap-8">
              {[
                { id: 'home', label: 'Главная' },
                { id: 'catalog', label: 'Каталог' },
                { id: 'about', label: 'О бренде' },
                { id: 'delivery', label: 'Доставка' },
                { id: 'contacts', label: 'Контакты' }
              ].map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`text-sm font-medium transition-colors hover:text-luxury-gold ${
                    activeSection === section.id ? 'text-luxury-gold' : 'text-foreground'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
                    <Icon name="User" size={16} className="mr-2" />
                    {user.full_name || user.email}
                  </Button>
                  {user.role === 'admin' && (
                    <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                      <Icon name="Settings" size={16} className="mr-2" />
                      Админ
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <Icon name="LogOut" size={16} />
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setAuthDialogOpen(true)}>
                  <Icon name="User" size={16} className="mr-2" />
                  Войти
                </Button>
              )}

              <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Icon name="ShoppingBag" size={20} />
                  {cartItemsCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-luxury-gold text-white">
                      {cartItemsCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle className="font-serif text-2xl">Корзина</SheetTitle>
                </SheetHeader>
                <div className="mt-8 space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Корзина пуста</p>
                  ) : (
                    <>
                      {cart.map(item => (
                        <div key={item.id} className="flex gap-4 animate-fade-in">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.price.toLocaleString('ru-RU')} ₽
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Icon name="Minus" size={12} />
                              </Button>
                              <span className="text-sm w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Icon name="Plus" size={12} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-auto"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Icon name="X" size={12} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex justify-between text-lg font-serif">
                          <span>Итого:</span>
                          <span>{cartTotal.toLocaleString('ru-RU')} ₽</span>
                        </div>
                        
                        {user ? (
                          <form onSubmit={handleCheckout} className="space-y-3 mt-4">
                            <div>
                              <Label htmlFor="address">Адрес доставки</Label>
                              <Input id="address" name="address" required placeholder="Москва, ул. Примерная, 1" />
                            </div>
                            <div>
                              <Label htmlFor="phone">Телефон</Label>
                              <Input id="phone" name="phone" type="tel" required placeholder="+7 999 123-45-67" />
                            </div>
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                              Оформить заказ
                            </Button>
                          </form>
                        ) : (
                          <Button 
                            className="w-full bg-primary hover:bg-primary/90"
                            onClick={() => {
                              setAuthDialogOpen(true);
                              setCheckoutOpen(false);
                            }}
                          >
                            Войти для оформления
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            </div>
          </div>
        </div>
      </header>

      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
        onSuccess={() => {
          const savedUser = authApi.getUser();
          setUser(savedUser);
        }}
      />

      {activeSection === 'home' && (
        <div className="animate-fade-in">
          <section className="relative h-[600px] flex items-center justify-center bg-luxury-gray">
            <div className="text-center space-y-6 px-6">
              <h2 className="text-6xl md:text-7xl font-serif font-light tracking-wide">
                Новая коллекция
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Элегантность в каждой детали. Эксклюзивные изделия ручной работы.
              </p>
              <Button
                size="lg"
                onClick={() => setActiveSection('catalog')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
              >
                Смотреть каталог
              </Button>
            </div>
          </section>

          <section className="container mx-auto px-6 py-20">
            <h3 className="text-4xl font-serif text-center mb-12">Избранное</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {products.map(product => (
                <Card key={product.id} className="group overflow-hidden border-0 shadow-none animate-scale-in">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden aspect-square mb-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <h4 className="text-lg font-medium mb-2">{product.name}</h4>
                    <p className="text-muted-foreground mb-4">
                      {product.price.toLocaleString('ru-RU')} ₽
                    </p>
                    <Button
                      onClick={() => addToCart(product)}
                      variant="outline"
                      className="w-full border-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      В корзину
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeSection === 'catalog' && (
        <div className="animate-fade-in">
          <section className="container mx-auto px-6 py-12">
            <h2 className="text-5xl font-serif text-center mb-12">Каталог</h2>
            
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={selectedCategory === cat.id ? "bg-primary" : ""}
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {filteredProducts.map(product => (
                <Card key={product.id} className="group overflow-hidden border-0 shadow-none animate-scale-in">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden aspect-square mb-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <h4 className="text-lg font-medium mb-2">{product.name}</h4>
                    <p className="text-muted-foreground mb-4">
                      {product.price.toLocaleString('ru-RU')} ₽
                    </p>
                    <Button
                      onClick={() => addToCart(product)}
                      variant="outline"
                      className="w-full border-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      В корзину
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeSection === 'about' && (
        <div className="animate-fade-in">
          <section className="container mx-auto px-6 py-20 max-w-4xl">
            <h2 className="text-5xl font-serif text-center mb-12">О бренде</h2>
            <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
              <p>
                MAISON — это воплощение элегантности и утончённости в мире моды. Мы создаём эксклюзивные
                изделия, которые подчёркивают индивидуальность и статус наших клиентов.
              </p>
              <p>
                Каждое изделие изготавливается вручную из премиальных материалов, с вниманием к мельчайшим
                деталям. Наша философия — качество превыше всего.
              </p>
              <p>
                Мы верим, что истинная роскошь не кричит о себе, а говорит тихим голосом совершенства.
              </p>
            </div>
          </section>
        </div>
      )}

      {activeSection === 'delivery' && (
        <div className="animate-fade-in">
          <section className="container mx-auto px-6 py-20 max-w-4xl">
            <h2 className="text-5xl font-serif text-center mb-12">Доставка и оплата</h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-serif mb-4">Доставка</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="mt-1 text-luxury-gold" />
                    <span>Бесплатная доставка по Москве при заказе от 50 000 ₽</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="mt-1 text-luxury-gold" />
                    <span>Доставка по России — 1-3 рабочих дня</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Check" size={20} className="mt-1 text-luxury-gold" />
                    <span>Международная доставка — 5-7 рабочих дней</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-2xl font-serif mb-4">Оплата</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <Icon name="CreditCard" size={20} className="mt-1 text-luxury-gold" />
                    <span>Банковские карты (Visa, Mastercard, Мир)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Wallet" size={20} className="mt-1 text-luxury-gold" />
                    <span>Электронные кошельки</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="Building" size={20} className="mt-1 text-luxury-gold" />
                    <span>Банковский перевод для юридических лиц</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeSection === 'contacts' && (
        <div className="animate-fade-in">
          <section className="container mx-auto px-6 py-20 max-w-4xl">
            <h2 className="text-5xl font-serif text-center mb-12">Контакты</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-serif mb-3">Адрес шоурума</h3>
                  <p className="text-muted-foreground">
                    Москва, Тверская улица, 15<br />
                    БЦ «Премиум», 3 этаж
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-serif mb-3">Телефон</h3>
                  <p className="text-muted-foreground">+7 (495) 123-45-67</p>
                </div>
                <div>
                  <h3 className="text-xl font-serif mb-3">Email</h3>
                  <p className="text-muted-foreground">info@maison.ru</p>
                </div>
                <div>
                  <h3 className="text-xl font-serif mb-3">Режим работы</h3>
                  <p className="text-muted-foreground">
                    Пн-Пт: 11:00 — 20:00<br />
                    Сб-Вс: 12:00 — 19:00
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-serif mb-3">Свяжитесь с нами</h3>
                <input
                  type="text"
                  placeholder="Ваше имя"
                  className="w-full px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                />
                <textarea
                  placeholder="Сообщение"
                  rows={4}
                  className="w-full px-4 py-3 border border-border focus:outline-none focus:ring-2 focus:ring-luxury-gold resize-none"
                />
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Отправить
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}

      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-serif text-xl mb-4">MAISON</h4>
              <p className="text-sm text-muted-foreground">
                Элегантность в каждой детали
              </p>
            </div>
            <div>
              <h5 className="font-medium mb-4">Покупателям</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => setActiveSection('catalog')}>Каталог</button></li>
                <li><button onClick={() => setActiveSection('delivery')}>Доставка</button></li>
                <li>Оплата</li>
                <li>Возврат</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-4">Компания</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => setActiveSection('about')}>О бренде</button></li>
                <li><button onClick={() => setActiveSection('contacts')}>Контакты</button></li>
                <li>Вакансии</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-4">Социальные сети</h5>
              <div className="flex gap-4">
                <Button variant="ghost" size="icon">
                  <Icon name="Instagram" size={20} />
                </Button>
                <Button variant="ghost" size="icon">
                  <Icon name="Facebook" size={20} />
                </Button>
                <Button variant="ghost" size="icon">
                  <Icon name="Twitter" size={20} />
                </Button>
              </div>
            </div>
          </div>
          <Separator className="my-8" />
          <p className="text-center text-sm text-muted-foreground">
            © 2024 MAISON. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;