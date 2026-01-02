import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Icon from '@/components/ui/icon';
import { authService } from '@/lib/auth';

const API_URL = 'https://functions.poehali.dev/ae53e1c2-96ac-4a9e-924e-9692a718ddf1';
const BOOKMARKS_API = 'https://functions.poehali.dev/b6eb6b5d-3b18-4485-9db8-78d520d1e550';
const CHAT_API = 'https://functions.poehali.dev/1a769b02-9097-45b0-889b-2ce26ee269c3';

interface Article {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  image_url?: string;
}

interface ChatMessage {
  id: number;
  username: string;
  message: string;
  created_at: string;
}

const categories = [
  { id: 'all', name: 'Все', icon: 'Grid3x3' },
  { id: 'administrative', name: 'Административная практика', icon: 'Scale' },
  { id: 'rights', name: 'Права', icon: 'ShieldCheck' },
  { id: 'laws', name: 'Законы', icon: 'BookOpen' },
  { id: 'documents', name: 'Документы', icon: 'FileText' }
];

export default function Index() {
  const navigate = useNavigate();
  const user = authService.getUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    loadArticles();
    loadBookmarks();
    loadChatMessages();
    const interval = setInterval(loadChatMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadArticles = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${BOOKMARKS_API}?user_id=${user.id}`);
      const data = await response.json();
      setBookmarks(new Set(data));
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  };

  const loadChatMessages = async () => {
    try {
      const response = await fetch(CHAT_API);
      const data = await response.json();
      setChatMessages(data);
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          username: user.username,
          message: newMessage
        })
      });
      setNewMessage('');
      loadChatMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const toggleBookmark = async (id: number) => {
    if (!user) return;

    const isBookmarked = bookmarks.has(id);

    try {
      if (isBookmarked) {
        await fetch(`${BOOKMARKS_API}?user_id=${user.id}&article_id=${id}`, { method: 'DELETE' });
        const newBookmarks = new Set(bookmarks);
        newBookmarks.delete(id);
        setBookmarks(newBookmarks);
      } else {
        await fetch(BOOKMARKS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, article_id: id })
        });
        const newBookmarks = new Set(bookmarks);
        newBookmarks.add(id);
        setBookmarks(newBookmarks);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/auth');
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || article.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const bookmarkedArticles = articles.filter(article => bookmarks.has(article.id));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="Shield" size={32} className="text-primary-foreground" />
              <h1 className="text-2xl font-bold">Памятка полицейского</h1>
            </div>
            <div className="flex items-center gap-2">
              <Sheet open={chatOpen} onOpenChange={setChatOpen}>
                <SheetTrigger asChild>
                  <Button variant="secondary" size="icon" title="Чат">
                    <Icon name="MessageSquare" size={20} />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Общий чат</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col h-[calc(100vh-120px)] mt-4">
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className="bg-muted p-3 rounded-lg">
                          <div className="font-semibold text-sm text-primary">{msg.username}</div>
                          <div className="text-sm">{msg.message}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(msg.created_at).toLocaleString('ru-RU')}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Напишите сообщение..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button onClick={sendMessage} size="icon">
                        <Icon name="Send" size={20} />
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              {user?.is_admin && (
                <Button 
                  variant="secondary" 
                  size="icon"
                  onClick={() => navigate('/admin')}
                  title="Админ-панель"
                >
                  <Icon name="Settings" size={20} />
                </Button>
              )}
              <Button 
                variant="secondary" 
                size="icon"
                onClick={handleLogout}
                title="Выйти"
              >
                <Icon name="LogOut" size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6 relative">
          <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по статьям, законам, документам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Icon name="BookOpen" size={18} />
              Материалы
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="flex items-center gap-2">
              <Icon name="Bookmark" size={18} />
              Закладки ({bookmarks.size})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                    activeCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-card hover:bg-muted'
                  }`}
                >
                  <Icon name={cat.icon} size={24} />
                  <span className="text-xs text-center font-medium">{cat.name}</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Icon name="Loader2" size={48} className="animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : filteredArticles.length === 0 ? (
              <Card className="p-8 text-center">
                <Icon name="SearchX" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Ничего не найдено</p>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="space-y-3">
                {filteredArticles.map(article => (
                  <AccordionItem key={article.id} value={article.id} className="border rounded-lg overflow-hidden bg-card">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-start justify-between w-full pr-2">
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-base mb-1">{article.title}</h3>
                          <div className="flex flex-wrap gap-1">
                            {article.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(article.id);
                          }}
                          className="ml-2"
                        >
                          <Icon
                            name="Bookmark"
                            size={20}
                            className={bookmarks.has(article.id) ? 'fill-primary text-primary' : 'text-muted-foreground'}
                          />
                        </button>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                      <p className="text-sm text-muted-foreground leading-relaxed">{article.content}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>

          <TabsContent value="bookmarks" className="space-y-3">
            {bookmarkedArticles.length === 0 ? (
              <Card className="p-8 text-center">
                <Icon name="BookmarkX" size={48} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">Нет сохранённых материалов</p>
                <p className="text-sm text-muted-foreground">Добавьте закладки для быстрого доступа</p>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="space-y-3">
                {bookmarkedArticles.map(article => (
                  <AccordionItem key={article.id} value={article.id} className="border rounded-lg overflow-hidden bg-card">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-start justify-between w-full pr-2">
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-base mb-1">{article.title}</h3>
                          <div className="flex flex-wrap gap-1">
                            {article.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(article.id);
                          }}
                          className="ml-2"
                        >
                          <Icon
                            name="Bookmark"
                            size={20}
                            className="fill-primary text-primary"
                          />
                        </button>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2">
                      <p className="text-sm text-muted-foreground leading-relaxed">{article.content}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <div className="h-4" />
    </div>
  );
}